import type { HeroStatsData } from "@/components/HeroStats";

/**
 * Store screenshot capture, and nothing else.
 *
 * Set EXPO_PUBLIC_SCREENSHOT_MODE=1 when starting Metro. `__DEV__` is false in
 * release builds and the bundler strips every branch behind it, so none of
 * this can reach an installed app.
 */
export const SCREENSHOT_MODE =
  __DEV__ && process.env.EXPO_PUBLIC_SCREENSHOT_MODE === "1";

/**
 * Captured in the offseason, the hero shows a finished season: pace equal to
 * the total, so the block falls back to games played. This shows the state a
 * user sees all season instead, one wedgie short of the final count and on
 * pace for it.
 *
 * Derived from the live numbers rather than written in, so the capture stays
 * believable if the data moves: with a final total of 74 and a previous record
 * of 63, it reads 73 wedgies, a new all-time record, on pace for 74.
 */
export function heroForScreenshot(stats: HeroStatsData): HeroStatsData {
  if (!SCREENSHOT_MODE) return stats;
  return {
    ...stats,
    totalWedgies: stats.totalWedgies - 1,
    currentPace: stats.totalWedgies,
  };
}

/**
 * Drops the newest wedgie from a latest-first list, so the rows under a hero
 * showing one fewer do not start with the one it has not counted yet.
 */
export function latestForScreenshot<T>(rows: T[]): T[] {
  return SCREENSHOT_MODE ? rows.slice(1) : rows;
}
