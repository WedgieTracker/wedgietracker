import { eq } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { global } from "@wedgietracker/core/schema";
import { db } from "~/server/db";
import { stripe } from "~/server/services/stripe";

/**
 * When a season's coffees start counting: 1 July of its first year, the
 * off-season, so a coffee bought after the Finals goes to the next season.
 */
export function seasonCoffeeStart(seasonName: string): Date | null {
  const year = Number(/^(\d{4})/.exec(seasonName)?.[1]);
  return Number.isFinite(year) && year > 0
    ? new Date(Date.UTC(year, 6, 1))
    : null;
}

/**
 * Coffees bought this season: every paid Stripe Checkout tagged as a coffee
 * since the season's start, at $1 a coffee. Read from Stripe and cached for
 * an hour; if Stripe can't be reached it counts as none rather than breaking
 * the page.
 */
export async function getSeasonCoffees(): Promise<{
  season: string | null;
  coffees: number;
}> {
  "use cache";
  cacheLife({ revalidate: 3600 });

  const settings = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });
  const start = settings
    ? seasonCoffeeStart(settings.currentSeason.name)
    : null;
  const season = settings?.currentSeason.name ?? null;
  if (!start) return { season, coffees: 0 };

  try {
    let cents = 0;
    for await (const session of stripe.checkout.sessions.list({
      created: { gte: Math.floor(start.getTime() / 1000) },
      status: "complete",
      limit: 100,
    })) {
      if (
        session.metadata?.coffee === "true" &&
        session.payment_status === "paid"
      ) {
        cents += session.amount_subtotal ?? 0;
      }
    }
    return { season, coffees: Math.round(cents / 100) };
  } catch (error) {
    console.error("Couldn't count this season's coffees", error);
    return { season, coffees: 0 };
  }
}
