import { api } from "~/trpc/react";

interface SeasonWithStats {
  name: string;
  totalWedgies: number;
}

/**
 * Pick the season to fall back to when the current season has no wedgies yet.
 *
 * - Returns `null` when seasons or the current-season name aren't yet known.
 * - When the current season is the first entry in the list, returns the most
 *   recent season that actually has wedgies (so a brand-new season still shows
 *   useful data instead of an empty page).
 * - Otherwise returns the season immediately before the current one in the list.
 */
export function pickPreviousSeason<T extends SeasonWithStats>(
  seasons: T[] | undefined,
  currentSeasonName: string | undefined,
): T | null {
  if (!seasons || !currentSeasonName) return null;

  const currentSeasonIndex = seasons.findIndex(
    (s) => s.name === currentSeasonName,
  );

  if (currentSeasonIndex === 0) {
    return seasons.find((season) => season.totalWedgies > 0) ?? null;
  }

  return seasons[currentSeasonIndex - 1] ?? null;
}

export function useSeasonFallback() {
  const { data: global, isLoading: isLoadingGlobal } =
    api.admin.getGlobal.useQuery();
  const { data: seasons, isLoading: isLoadingSeasons } =
    api.season.getAllWithStats.useQuery();
  const { data: stats, isLoading: isLoadingStats } =
    api.wedgie.getStats.useQuery();

  const defaultSeason = global?.currentSeason?.name ?? "2025/26";
  const previousSeason = pickPreviousSeason(
    seasons,
    global?.currentSeason?.name,
  );
  const shouldShowPreviousSeason =
    stats?.currentSeasonWedgies === 0 && previousSeason;

  return {
    global,
    seasons,
    stats,
    defaultSeason,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: isLoadingGlobal || isLoadingSeasons || isLoadingStats,
  };
}
