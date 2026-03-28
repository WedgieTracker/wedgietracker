import { ne, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { season, global } from "~/server/schema";

interface PaceStats {
  currentTotalWedgies: number;
  currentTotalGames: number;
  totalEstimatedGames?: number;
}

export async function calculatePace({
  currentTotalWedgies,
  currentTotalGames,
  totalEstimatedGames = 1315, // Default value
}: PaceStats) {
  // Basic validation
  if (currentTotalGames <= 0) {
    return {
      simplePace: 0,
      rmPace: 0,
      medianPace: 0,
      gamesRemaining: totalEstimatedGames,
    };
  }

  const wedgiesPerGame = currentTotalWedgies / currentTotalGames;
  const gamesRemaining = totalEstimatedGames - currentTotalGames;

  // Calculate simple pace
  const simplePace = Math.round(totalEstimatedGames * wedgiesPerGame);

  // Get historical rates from database
  const seasons = await db.query.season.findMany({
    where: ne(season.name, "GEMS"),
    with: { wedgies: { columns: { id: true } } },
  });

  const filteredSeasons = seasons.filter((s) => s.totalGames > 0);

  // get the current number of wedgies from the global table
  const currentWedgies = await db.query.global.findFirst({
    where: eq(global.id, 1),
    columns: { currentTotalWedgies: true, currentSeasonId: true },
  });

  // replace the currentWedgies in the seasons array where currentSeasonId matches
  const seasonRates = filteredSeasons.map((s) => {
    if (s.id === currentWedgies?.currentSeasonId) {
      return currentWedgies.currentTotalWedgies / s.totalGames;
    }
    return s.wedgies.length / s.totalGames;
  });

  const averageSeasonRate =
    seasonRates.reduce((acc, rate) => acc + rate, 0) / seasonRates.length;

  const rmPace = Math.round(
    currentTotalWedgies + averageSeasonRate * gamesRemaining,
  );
  // const medianPaceUnclamped = Math.round((simplePace + rmPace) / 2);
  // const medianPace = Math.max(40, Math.min(69, medianPaceUnclamped));
  const medianPace = rmPace;
  return {
    simplePace,
    rmPace,
    medianPace,
    gamesRemaining,
  };
}
