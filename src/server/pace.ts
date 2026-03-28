import { ne, eq } from "drizzle-orm";
import { db } from "./db";
import { season, global } from "./schema";
import { computePace } from "~/utils/paceCalculator";

interface CalculatePaceParams {
  currentTotalWedgies: number;
  currentTotalGames: number;
  totalEstimatedGames?: number;
}

/**
 * Fetches historical season rates from the database and computes pace projections.
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

  const filteredSeasons = seasons.filter((s) => s.totalGames > 0);

  const currentWedgies = await db.query.global.findFirst({
    where: eq(global.id, 1),
    columns: { currentTotalWedgies: true, currentSeasonId: true },
  });

  const seasonRates = filteredSeasons.map((s) => {
    if (s.id === currentWedgies?.currentSeasonId) {
      return currentWedgies.currentTotalWedgies / s.totalGames;
    }
    return s.wedgies.length / s.totalGames;
  });

  return computePace({
    currentTotalWedgies,
    currentTotalGames,
    totalEstimatedGames,
    seasonRates,
  });
}
