import { eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { coffeeCheckout, global, season } from "@wedgietracker/core/schema";
import { db } from "~/server/db";
import { CACHE_TAGS } from "~/server/cache";
import { stripe } from "~/server/services/stripe";

/** Coffees are $1 each. */
const COFFEE_CENTS = 100;

/**
 * This season's coffees, as stored on the season. Cached until a new coffee
 * is recorded, which clears the tag.
 */
export async function getSeasonCoffees(): Promise<{
  season: string | null;
  coffees: number;
}> {
  "use cache";
  cacheTag(CACHE_TAGS.COFFEES);
  cacheLife("max");

  const settings = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });
  return {
    season: settings?.currentSeason.name ?? null,
    coffees: settings?.currentSeason.coffees ?? 0,
  };
}

/**
 * Adds a finished coffee checkout to the current season's total, once. The
 * session is read back from Stripe, so only a paid, live-mode coffee counts, and the
 * session id is kept so a refreshed thanks page doesn't count it again.
 * Returns how many coffees the checkout was for, or null if it isn't one.
 */
export async function recordCoffeeCheckout(
  sessionId: string,
): Promise<number | null> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  // Only real payments count: a test-mode checkout (a test key on a machine
  // pointed at the real database) must never reach the scoreboard.
  if (
    !session.livemode ||
    session.metadata?.coffee !== "true" ||
    session.payment_status !== "paid"
  ) {
    return null;
  }
  const coffees = Math.round((session.amount_subtotal ?? 0) / COFFEE_CENTS);
  if (coffees < 1) return null;

  const settings = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });
  if (!settings) return null;
  const seasonName = settings.currentSeason.name;

  const added = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(coffeeCheckout)
      .values({ sessionId, seasonName, coffees })
      .onConflictDoNothing()
      .returning({ sessionId: coffeeCheckout.sessionId });
    if (inserted.length === 0) return false;
    await tx
      .update(season)
      .set({ coffees: sql`${season.coffees} + ${coffees}` })
      .where(eq(season.name, seasonName));
    return true;
  });

  if (added) revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
  return coffees;
}
