import { api } from "~/trpc/server";
import { getSeasonCoffees } from "~/server/coffees";
import { CoffeeScoreboard } from "./CoffeeScoreboard";

/** The Coffees vs Wedgies board with this season's real numbers. */
export async function CoffeeScoreboardLive() {
  const [{ season, coffees }, stats] = await Promise.all([
    getSeasonCoffees(),
    api.wedgie.getStats(),
  ]);
  return (
    <CoffeeScoreboard
      season={season}
      coffees={coffees}
      wedgies={stats.currentSeasonWedgies}
    />
  );
}

/** The board's shape with nothing in it, held while the numbers load. */
export function CoffeeScoreboardSkeleton() {
  return (
    <div aria-hidden="true" className="invisible w-full">
      <CoffeeScoreboard season="0000/00" coffees={0} wedgies={0} />
    </div>
  );
}
