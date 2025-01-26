import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  const seasons = await prisma.season.findMany({
    where: {
      NOT: { name: "GEMS" },
      totalGames: { gt: 0 },
    },
    include: {
      _count: {
        select: { wedgies: true },
      },
    },
  });

  // get the current number of wedgies from the global table
  const currentWedgies = await prisma.global.findUnique({
    where: { id: 1 },
    select: { currentTotalWedgies: true, currentSeasonId: true },
  });

  console.log(currentWedgies);
  console.log(seasons);

  // replace the currentWedgies in the seasons array where currentSeasonId matches
  const seasonRates = seasons.map((season) => {
    if (season.id === currentWedgies?.currentSeasonId) {
      console.log("currentWedgies", currentWedgies.currentTotalWedgies);
      return currentWedgies.currentTotalWedgies / season.totalGames;
    }
    return season._count.wedgies / season.totalGames;
  });

  const averageSeasonRate =
    seasonRates.reduce((acc, rate) => acc + rate, 0) / seasonRates.length;

  const rmPace = Math.round(
    currentTotalWedgies + averageSeasonRate * gamesRemaining,
  );
  const medianPace = Math.round((simplePace + rmPace) / 2);

  return {
    simplePace,
    rmPace,
    medianPace,
    gamesRemaining,
  };
}
