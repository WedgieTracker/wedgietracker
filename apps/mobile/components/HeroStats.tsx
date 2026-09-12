import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useCountUp } from "@/components/Counter";
import { PillButton } from "@/components/PillButton";
import { WaveCounterPanel } from "@/components/WaveCounterPanel";
import { useFluidType } from "@/lib/fluid";
import { SCREENSHOT_MODE } from "@/lib/screenshot";
import { colors, fonts, radius, space } from "@/lib/theme";

export interface HeroStatsData {
  totalWedgies: number;
  currentPace: number;
  gamesPlayed: number;
  previousRecord: number;
  lastWedgie: Date | string | null;
  liveGames: boolean;
}

/**
 * Port of apps/web/src/components/home/Stats.tsx - the wave-filled hero with
 * the running total, and the pace/drought block beneath it.
 */
export function HeroStats({
  stats,
  onMoreStats,
}: {
  stats: HeroStatsData;
  onMoreStats: () => void;
}) {
  return (
    <View>
      <WaveCounterPanel
        value={stats.totalWedgies}
        previousRecord={stats.previousRecord}
      />

      <PaceBlock stats={stats} onMoreStats={onMoreStats} />
    </View>
  );
}

function PaceBlock({
  stats,
  onMoreStats,
}: {
  stats: HeroStatsData;
  onMoreStats: () => void;
}) {
  const t = useFluidType();

  // The web app hides pace until it diverges from the running total.
  const showPace = stats.currentPace !== stats.totalWedgies;
  const paceValue = useCountUp(
    showPace ? stats.currentPace : stats.gamesPlayed,
  );
  const daysAgo = daysSince(stats.lastWedgie);

  const labelSize = showPace ? t.paceText : 20;
  const numberSize = showPace ? t.paceNumber : 48;

  return (
    <View style={styles.pacePanel}>
      <View style={styles.moreStatsWrap}>
        <PillButton label="MORE STATS" onPress={onMoreStats} />
      </View>

      <View style={[styles.paceRow, !showPace && styles.paceRowStacked]}>
        <View style={[styles.paceColumn, !showPace && styles.paceColumnWide]}>
          <Text
            style={[styles.paceLabel, tight(labelSize)]}
            allowFontScaling={false}
          >
            {showPace ? "PACE" : "GAMES"}
          </Text>
          <Text
            style={[
              styles.paceNumber,
              tight(numberSize),
              // The web uses `mt-[-.2em]`; a touch less overlap here, which
              // reads better at the sizes the label actually renders at.
              { marginTop: -0.12 * numberSize },
            ]}
            allowFontScaling={false}
          >
            {paceValue}
          </Text>
        </View>

        {daysAgo !== null && daysAgo > 0 ? (
          <View style={styles.droughtRow}>
            <View style={styles.droughtCount}>
              <Text
                style={[styles.droughtNumber, tight(DROUGHT_NUMBER)]}
                allowFontScaling={false}
              >
                {daysAgo}
              </Text>
              <Text
                style={[
                  styles.droughtUnit,
                  tight(DROUGHT_UNIT),
                  // `mt-[-.6em]` on the web
                  { marginTop: -0.6 * DROUGHT_UNIT },
                ]}
                allowFontScaling={false}
              >
                {daysAgo === 1 ? "DAY" : "DAYS"}
              </Text>
            </View>
            <Text
              style={[styles.droughtLabel, tight(14)]}
              allowFontScaling={false}
            >
              WITHOUT{"\n"}WEDGIES
            </Text>
          </View>
        ) : (
          <FreshWedgie />
        )}
      </View>

      {stats.liveGames ? (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText} allowFontScaling={false}>
            LIVE GAMES
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const DROUGHT_NUMBER = 48;
const DROUGHT_UNIT = 14;
const FRESH_NEW = 36;
const FRESH_WEDGIE = 29;

/**
 * `leading-none` - a line box exactly as tall as the type. Without it React
 * Native's default leading pads each line and the labels cannot overlap the
 * numbers the way they do on the site.
 */
function tight(fontSize: number) {
  return { fontSize, lineHeight: fontSize };
}

const NY_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar day `date` falls on in US Eastern, as a UTC timestamp. */
function easternDay(date: Date): number {
  const parts = NY_DATE.formatToParts(date);
  const part = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day"));
}

/**
 * Whole days since the last wedgie, measured in US Eastern because that is the
 * timezone games are scheduled in.
 *
 * The web version formats both dates to a string and re-parses them; Hermes
 * does not accept that format, so it compares calendar days directly instead.
 */
function daysSince(value: Date | string | null): number | null {
  if (!value) return null;

  const last = new Date(value);
  if (Number.isNaN(last.getTime())) return null;

  // Store screenshots only, see lib/screenshot.ts. Captured in the offseason
  // the panel reads "96 days without wedgies", true that day and an odd first
  // impression of an app that spends the season announcing new ones.
  if (SCREENSHOT_MODE) return 0;

  const diff = easternDay(new Date()) - easternDay(last);
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Half of `animation: colorShift 1s infinite` in apps/web/tailwind.config.ts:
 * yellow to pink takes half a second, pink back to yellow the other half.
 */
const COLOR_SHIFT_HALF_MS = 500;

/**
 * Blend the way a browser animates CSS colour. Reanimated gamma-corrects by
 * default (2.2), which lifts the halfway point between yellow and pink to a
 * pale, almost white wash, so the words flashed white on every swap.
 */
const PLAIN_SRGB = { gamma: 1 } as const;

/**
 * Port of the web's `animate-color-shift` / `animate-color-shift-delayed` pair:
 * NEW and WEDGIE swap between yellow and pink, always opposite each other.
 *
 * One value yoyos 0 to 1 and back, and the two words read it in opposite
 * directions, so they cannot drift out of phase.
 */
function FreshWedgie() {
  const reduceMotion = useReducedMotion();
  const shift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    shift.value = withRepeat(
      withTiming(1, {
        duration: COLOR_SHIFT_HALF_MS,
        // CSS's default `ease` timing function.
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(shift);
  }, [reduceMotion, shift]);

  const newStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shift.value,
      [0, 1],
      [colors.yellow, colors.pink],
      "RGB",
      PLAIN_SRGB,
    ),
  }));
  const wedgieStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shift.value,
      [0, 1],
      [colors.pink, colors.yellow],
      "RGB",
      PLAIN_SRGB,
    ),
  }));

  return (
    <View style={styles.freshRow}>
      <Animated.Text
        style={[styles.freshNew, tight(FRESH_NEW), !reduceMotion && newStyle]}
        allowFontScaling={false}
      >
        NEW
      </Animated.Text>
      <Animated.Text
        style={[
          styles.freshWedgie,
          tight(FRESH_WEDGIE),
          { marginTop: -0.3 * FRESH_WEDGIE },
          !reduceMotion && wedgieStyle,
        ]}
        allowFontScaling={false}
      >
        WEDGIE
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pacePanel: {
    minHeight: 192,
    backgroundColor: colors.darkpurple,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    paddingTop: 48,
    paddingBottom: space.lg,
  },
  moreStatsWrap: {
    position: "absolute",
    top: -19,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  paceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  // `flex-col gap-2` on the web when pace is hidden
  paceRowStacked: { flexDirection: "column", gap: space.sm },
  paceColumn: { width: 130, alignItems: "center" },
  paceColumnWide: { width: 140 },
  paceLabel: {
    fontFamily: fonts.black,
    color: colors.pink,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  paceNumber: {
    fontFamily: fonts.black,
    color: colors.yellow,
    textAlign: "center",
  },

  droughtRow: {
    width: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  droughtCount: { alignItems: "center" },
  droughtNumber: { fontFamily: fonts.black, color: colors.yellow },
  droughtUnit: { fontFamily: fonts.black, color: colors.pink },
  droughtLabel: {
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: 0.8,
  },

  freshRow: { width: 140, alignItems: "center" },
  freshNew: { fontFamily: fonts.black, color: colors.pink },
  freshWedgie: { fontFamily: fonts.black, color: colors.yellow },

  liveBadge: {
    position: "absolute",
    bottom: space.sm,
    left: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.live,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  liveText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 10,
    letterSpacing: 1,
  },
});
