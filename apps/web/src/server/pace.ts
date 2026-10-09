import { ne, eq } from "drizzle-orm";
import { db } from "./db";
import { season, global } from "@wedgietracker/core/schema";
import { computePace } from "@wedgietracker/core/utils/paceCalculator";

interface CalculatePaceParams {
  currentTotalWedgies: number;
  currentTotalGames: number;
  totalEstimatedGames?: number;
}

/**
 * Fetches completed seasons' rates from the database and computes pace projections.
 */
export async function calculatePace({
  currentTotalWedgies,
  currentTotalGames,
  totalEstimatedGames = 1315,
}: CalculatePaceParams) {
  const seasons = await db.query.season.findMany({
    where: ne(season.name, "GEMS"),
    with: { wedgies: { columns: { id: true } } },
  });

  const globalRow = await db.query.global.findFirst({
    where: eq(global.id, 1),
    columns: { currentSeasonId: true },
  });

  // Only completed seasons feed the historical rate. The current season's
  // own rate swings wildly over its first games (0 before the first wedgie,
  // then 1-in-3), and averaging it in made early-season pace jump around.
  const seasonRates = seasons
    .filter((s) => s.totalGames > 0 && s.id !== globalRow?.currentSeasonId)
    .map((s) => s.wedgies.length / s.totalGames);

  return computePace({
    currentTotalWedgies,
    currentTotalGames,
    totalEstimatedGames,
    seasonRates,
  });
}
