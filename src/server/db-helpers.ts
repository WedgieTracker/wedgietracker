import { eq, count } from "drizzle-orm";
import type { db } from "./db";
import { global, wedgie } from "./schema";
import { calculatePace } from "~/server/pace";

/**
 * Builds team standings from an array of wedgies with teamName and teamAgainstName.
 * Counts each team's involvement (as team or opponent) and returns sorted standings.
 */
export function buildTeamStandings(
  wedgies: { teamName: string; teamAgainstName: string }[],
  opts: { includeOpponents?: boolean; limit?: number } = {},
) {
  const { includeOpponents = true, limit } = opts;
  const teamCounts = new Map<string, number>();

  wedgies.forEach((w) => {
    teamCounts.set(w.teamName, (teamCounts.get(w.teamName) ?? 0) + 1);
    if (includeOpponents) {
      teamCounts.set(
        w.teamAgainstName,
        (teamCounts.get(w.teamAgainstName) ?? 0) + 1,
      );
    }
  });

  const sorted = Array.from(teamCounts.entries())
    .sort((a, b) => {
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      return a[0].localeCompare(b[0]);
    })
    .map(([name, cnt]) => ({ name, count: cnt }));

  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * After creating/updating a wedgie, checks if the season's wedgie count exceeds
 * the stored global total and updates global stats + pace if so.
 */
export async function maybeUpdateGlobalWedgieCount(
  dbInstance: typeof db,
  seasonName: string,
) {
  const globalRow = await dbInstance.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });

  if (globalRow?.currentSeason?.name !== seasonName) return;

  const [countResult] = await dbInstance
    .select({ count: count() })
    .from(wedgie)
    .where(eq(wedgie.seasonName, seasonName));

  const currentTotalWedgiesSeason = countResult?.count ?? 0;

  if (currentTotalWedgiesSeason > globalRow.currentTotalWedgies) {
    const pace = await calculatePace({
      currentTotalWedgies: currentTotalWedgiesSeason,
      currentTotalGames: globalRow.currentTotalGames,
    });

    await dbInstance
      .update(global)
      .set({
        currentTotalWedgies: currentTotalWedgiesSeason,
        simplePace: pace.simplePace,
        mathPace: pace.rmPace,
        pace: pace.medianPace,
      })
      .where(eq(global.id, 1));
  }
}
