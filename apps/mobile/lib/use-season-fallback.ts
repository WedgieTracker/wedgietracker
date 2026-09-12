import { api } from "@/lib/api";

/**
 * Port of apps/web/src/hooks/use-season-fallback.ts - when the current season
 * has no wedgies yet, fall back to the last season that does so the screen is
 * not empty at the start of a season.
 */
interface SeasonWithStats {
  name: string;
  totalWedgies: number;
}

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
  const global = api.admin.getGlobal.useQuery();
  const seasons = api.season.getAllWithStats.useQuery();
  const stats = api.wedgie.getStats.useQuery();

  const defaultSeason = global.data?.currentSeason?.name ?? "2025/26";
  const previousSeason = pickPreviousSeason(
    seasons.data,
    global.data?.currentSeason?.name,
  );
  const shouldShowPreviousSeason =
    stats.data?.currentSeasonWedgies === 0 && previousSeason;

  return {
    global: global.data,
    seasons: seasons.data,
    stats: stats.data,
    defaultSeason,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: global.isPending || seasons.isPending || stats.isPending,
  };
}
