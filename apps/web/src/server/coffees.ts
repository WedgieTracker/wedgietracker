import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
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

  const added = await addSeasonCoffees(sessionId, coffees);
  return added === "no-season" ? null : coffees;
}

/**
 * Adds coffees to the current season's total, once per key. The key is kept
 * in coffee_checkout, so the same purchase sent again adds nothing. Returns
 * "added", "duplicate" when the key was already counted, or "no-season".
 */
export async function addSeasonCoffees(
  key: string,
  coffees: number,
): Promise<"added" | "duplicate" | "no-season"> {
  const settings = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });
  if (!settings) return "no-season";
  const seasonName = settings.currentSeason.name;

  const added = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(coffeeCheckout)
      .values({ sessionId: key, seasonName, coffees })
      .onConflictDoNothing()
      .returning({ sessionId: coffeeCheckout.sessionId });
    if (inserted.length === 0) return false;
    await tx
      .update(season)
      .set({ coffees: sql`${season.coffees} + ${coffees}` })
      .where(eq(season.name, seasonName));
    return true;
  });

  if (!added) return "duplicate";
  revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
  return "added";
}

export type CoffeeRefundResult =
  | { status: "changed"; coffees: number }
  | { status: "unchanged" }
  | { status: "unknown" };

/**
 * Takes a counted purchase's coffees back off the season it was added to, and
 * marks its row refunded at the given time. Only an unrefunded row changes, so
 * the same refund sent again does nothing. The season never goes below 0.
 * Returns "unknown" when no purchase has that key.
 */
export async function refundSeasonCoffees(
  key: string,
  refundedAt: string,
): Promise<CoffeeRefundResult> {
  const refunded = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(coffeeCheckout)
      .set({ refundedAt })
      .where(
        and(
          eq(coffeeCheckout.sessionId, key),
          isNull(coffeeCheckout.refundedAt),
        ),
      )
      .returning({
        seasonName: coffeeCheckout.seasonName,
        coffees: coffeeCheckout.coffees,
      });
    if (!row) return null;
    await tx
      .update(season)
      .set({ coffees: sql`max(0, ${season.coffees} - ${row.coffees})` })
      .where(eq(season.name, row.seasonName));
    return row.coffees;
  });

  if (refunded === null) return unchangedOrUnknown(key);
  revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
  return { status: "changed", coffees: refunded };
}

/**
 * Adds a refunded purchase's coffees back to the season it was added to, and
 * clears its refund. Only a refunded row changes, so the same reversal sent
 * again does nothing. Returns "unknown" when no purchase has that key.
 */
export async function restoreSeasonCoffees(
  key: string,
): Promise<CoffeeRefundResult> {
  const restored = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(coffeeCheckout)
      .set({ refundedAt: null })
      .where(
        and(
          eq(coffeeCheckout.sessionId, key),
          isNotNull(coffeeCheckout.refundedAt),
        ),
      )
      .returning({
        seasonName: coffeeCheckout.seasonName,
        coffees: coffeeCheckout.coffees,
      });
    if (!row) return null;
    await tx
      .update(season)
      .set({ coffees: sql`${season.coffees} + ${row.coffees}` })
      .where(eq(season.name, row.seasonName));
    return row.coffees;
  });

  if (restored === null) return unchangedOrUnknown(key);
  revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
  return { status: "changed", coffees: restored };
}

async function unchangedOrUnknown(key: string): Promise<CoffeeRefundResult> {
  const [row] = await db
    .select({ sessionId: coffeeCheckout.sessionId })
    .from(coffeeCheckout)
    .where(eq(coffeeCheckout.sessionId, key))
    .limit(1);
  return row ? { status: "unchanged" } : { status: "unknown" };
}
