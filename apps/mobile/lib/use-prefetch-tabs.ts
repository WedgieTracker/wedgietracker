import { useEffect } from "react";

import { api } from "@/lib/api";
import { useSeasonFallback } from "@/lib/use-season-fallback";

/**
 * Warms the cache for every tab while Home is on screen.
 *
 * Tabs mount lazily, so each one's first query used to start the moment it was
 * opened. The screen showed the loader for exactly as long as that request
 * took, which on a good connection is a few frames: a visible flash on the
 * first visit to each tab and never again. With the data already cached, a
 * first visit renders the content straight away.
 *
 * The inputs must match each screen's own query exactly, or the prefetch
 * fills a cache entry nobody reads. Both list screens open on the same season
 * this computes, see `openingSeason` in all-wedgies.tsx and `initialSeason` in
 * standings.tsx.
 */
export function usePrefetchTabs(): void {
  const utils = api.useUtils();
  const {
    global,
    defaultSeason,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading,
  } = useSeasonFallback();

  const season =
    (shouldShowPreviousSeason ? previousSeason?.name : undefined) ??
    global?.currentSeason?.name ??
    defaultSeason;

  useEffect(() => {
    if (isLoading) return;
    void utils.wedgie.getAll.prefetch();
    void utils.wedgie.getBySeason.prefetch({ season });
    void utils.wedgie.getSeasonStandings.prefetch({
      season,
      includeOpponents: true,
    });
    void utils.wedgie.getNerdStats.prefetch();
  }, [isLoading, season, utils]);
}
