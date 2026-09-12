interface PaceInput {
  currentTotalWedgies: number;
  currentTotalGames: number;
  totalEstimatedGames?: number;
  seasonRates: number[];
}

interface PaceResult {
  simplePace: number;
  rmPace: number;
  medianPace: number;
  gamesRemaining: number;
}

/**
 * Pure math function: computes pace projections from current stats and historical rates.
 * No database access — all data must be provided as input.
 */
export function computePace({
  currentTotalWedgies,
  currentTotalGames,
  totalEstimatedGames = 1315,
  seasonRates,
}: PaceInput): PaceResult {
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

  const simplePace = Math.round(totalEstimatedGames * wedgiesPerGame);

  if (seasonRates.length === 0) {
    return {
      simplePace,
      rmPace: simplePace,
      medianPace: simplePace,
      gamesRemaining,
    };
  }

  const averageSeasonRate =
    seasonRates.reduce((acc, rate) => acc + rate, 0) / seasonRates.length;

  const rmPace = Math.round(
    currentTotalWedgies + averageSeasonRate * gamesRemaining,
  );
  const medianPace = rmPace;

  return {
    simplePace,
    rmPace,
    medianPace,
    gamesRemaining,
  };
}
