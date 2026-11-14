import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, type RefObject } from "react";

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

/**
 * For capturing below the fold: with EXPO_PUBLIC_SHOT_SCROLL=1 on Metro, a
 * `shotY` param on the deep link (wedgietracker://standings?shotY=900)
 * scrolls the screen there once it has loaded. Dev builds only, like the
 * rest of this file.
 */
const SHOT_SCROLL = __DEV__ && process.env.EXPO_PUBLIC_SHOT_SCROLL === "1";

type Scrollable = {
  scrollTo?: (o: { y: number; animated: boolean }) => void;
  scrollToOffset?: (o: { offset: number; animated: boolean }) => void;
};

export function useShotScroll(ref: RefObject<unknown>) {
  const { shotY } = useLocalSearchParams<{ shotY?: string }>();
  useEffect(() => {
    if (!SHOT_SCROLL || !shotY) return;
    const y = Number(shotY);
    const timer = setTimeout(() => {
      const list = ref.current as Scrollable | null;
      list?.scrollTo?.({ y, animated: false });
      list?.scrollToOffset?.({ offset: y, animated: false });
    }, 2500);
    return () => clearTimeout(timer);
  }, [shotY, ref]);
}

/**
 * A screenshot driver for the simulator, where deep links ask for
 * confirmation and nothing can tap. With EXPO_PUBLIC_SHOT_DRIVER set to a
 * URL on Metro (http://localhost:8099/shot.json), the app polls it each
 * second for `{ "seq": 3, "route": "/standings?shotY=900" }` and opens the
 * route whenever `seq` changes. Dev builds only.
 */
const SHOT_DRIVER = __DEV__ ? process.env.EXPO_PUBLIC_SHOT_DRIVER : undefined;

export function useShotDriver() {
  useEffect(() => {
    if (!SHOT_DRIVER) return;
    let last = -1;
    const timer = setInterval(() => {
      fetch(SHOT_DRIVER)
        .then((r) => r.json() as Promise<{ seq: number; route: string }>)
        .then(({ seq, route }) => {
          if (seq === last) return;
          last = seq;
          if (route === "back") router.back();
          else router.navigate(route as Href);
        })
        .catch(() => undefined);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}
