import { api } from "~/trpc/react";

export function useSeasonFallback() {
  const { data: global, isLoading: isLoadingGlobal } =
    api.admin.getGlobal.useQuery();
  const { data: seasons, isLoading: isLoadingSeasons } =
    api.season.getAllWithStats.useQuery();
  const { data: stats, isLoading: isLoadingStats } =
    api.wedgie.getStats.useQuery();

  const defaultSeason = global?.currentSeason?.name ?? "2025/26";

  const getPreviousSeason = () => {
    if (!seasons || !global?.currentSeason?.name) return null;

    const currentSeasonIndex = seasons.findIndex(
      (s) => s.name === global.currentSeason.name,
    );

    if (currentSeasonIndex === 0) {
      const seasonWithWedgies = seasons.find(
        (season) => season.totalWedgies > 0,
      );
      return seasonWithWedgies ?? null;
    }

    return seasons[currentSeasonIndex - 1];
  };

  const previousSeason = getPreviousSeason();
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
