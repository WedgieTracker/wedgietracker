/**
 * Games in a full NBA season as the pace counts it: the 1,230 regular-season
 * games plus the play-in and playoffs.
 */
export const SEASON_GAMES = 1315;

/**
 * How much say past seasons get, in games. This season starts off with this
 * many made-up games at the normal rate, and its real games go on top: early
 * on the past outweighs the season so far, by midseason they count about the
 * same, and by the end it is mostly this season. 600 missed the final count
 * by the least when every formula was replayed through the 12 seasons from
 * 2014/15 to 2025/26.
 */
export const PRIOR_GAMES = 600;

/**
 * Recent seasons count a bit more: last season counts in full, the one before
 * at 80%, then 64%, and so on.
 */
export const RECENCY = 0.8;

interface PaceInput {
  currentTotalWedgies: number;
  currentTotalGames: number;
  totalEstimatedGames?: number;
  /** Each completed season's wedgies per game played, oldest first. */
  seasonRates: number[];
}

export interface PaceResult {
  /** This season's own rate stretched over the whole season. */
  simplePace: number;
  /** Wedgies so far + the games left at the plain average of past seasons (the pace until November 2026). */
  rmPace: number;
  /** The pace: wedgies so far + the games left at the blended rate. */
  medianPace: number;
  gamesRemaining: number;
}

/** A normal season's wedgies per game, with recent seasons counting more (rates oldest first). */
export function normalRate(seasonRates: number[]): number {
  let weighted = 0;
  let weights = 0;
  let weight = 1;
  for (let i = seasonRates.length - 1; i >= 0; i--) {
    weighted += weight * seasonRates[i]!;
    weights += weight;
    weight *= RECENCY;
  }
  return weights > 0 ? weighted / weights : 0;
}

/**
 * The rate for the games left: PRIOR_GAMES made-up games at the normal rate,
 * plus this season's real wedgies and games.
 */
export function blendedRate(
  wedgies: number,
  games: number,
  seasonRates: number[],
): number {
  const normal = normalRate(seasonRates);
  return (wedgies + PRIOR_GAMES * normal) / (Math.max(games, 0) + PRIOR_GAMES);
}

/**
 * Pure math function: computes pace projections from current stats and historical rates.
 * No database access — all data must be provided as input.
 */
export function computePace({
  currentTotalWedgies,
  currentTotalGames,
  totalEstimatedGames = SEASON_GAMES,
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
  const gamesRemaining = Math.max(totalEstimatedGames - currentTotalGames, 0);

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
  const medianPace = Math.round(
    currentTotalWedgies +
      blendedRate(currentTotalWedgies, currentTotalGames, seasonRates) *
        gamesRemaining,
  );

  return {
    simplePace,
    rmPace,
    medianPace,
    gamesRemaining,
  };
}
