import { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

import { useCountUp } from "@/components/Counter";
import { DaysCalendar } from "@/components/DaysCalendar";
import { PaceGauge } from "@/components/PaceGauge";
import { StickerButton } from "@/components/StickerButton";
import { WaveCounterPanel } from "@/components/WaveCounterPanel";
import { useWide } from "@/lib/wide";
import { SCREENSHOT_MODE } from "@/lib/screenshot";
import { colors, fonts, space } from "@/lib/theme";

export interface HeroStatsData {
  totalWedgies: number;
  currentPace: number;
  gamesPlayed: number;
  previousRecord: number;
  /** Not served by every API version yet, so it may be missing. */
  previousRecordSeason?: string | null;
  lastWedgie: Date | string | null;
  liveGames: boolean;
}

/**
 * Port of apps/web/src/components/home/Stats.tsx and StatsSkeleton.tsx: the
 * badge hero with the running total, then the pace gauge and the tear-off
 * calendar on night.
 *
 * With `stats` null it is the skeleton: the same pieces at the same sizes
 * with their figures left out, so the page does not jump when they arrive.
 */
export function HeroStats({
  stats,
  recordSeason,
  onMoreStats,
  onExplainPace,
}: {
  stats: HeroStatsData | null;
  /** Which season set the record, when the stats do not say. */
  recordSeason?: string | null;
  onMoreStats: () => void;
  /** Opens How the pace works, from a tap on the gauge. */
  onExplainPace?: () => void;
}) {
  const { height } = useWindowDimensions();
  const { wide } = useWide();

  return (
    <View>
      <WaveCounterPanel
        value={stats?.totalWedgies ?? null}
        previousRecord={stats?.previousRecord ?? Number.POSITIVE_INFINITY}
        // `min-h-[25em] flex-2` of an `80svh` column on a phone.
        minHeight={Math.max(400, height * 0.5)}
        // Edge to edge on a phone; on a wide screen it sits in a column, so
        // it gets the cards' rounded corners.
        style={wide ? styles.panelWide : undefined}
      />

      <View style={styles.night}>
        <View style={styles.moreStats}>
          <StickerButton
            label="MORE STATS"
            variant="flat"
            compact
            onPress={onMoreStats}
          />
        </View>

        {stats ? (
          <PaceRow
            stats={stats}
            recordSeason={stats.previousRecordSeason ?? recordSeason ?? null}
            onExplainPace={onExplainPace}
          />
        ) : (
          <View style={styles.grid} pointerEvents="none">
            <View style={styles.gaugeCol}>
              <PaceGauge pace={0} record={1} recordSeason={null} hidden />
            </View>
            <View style={styles.calendarCol}>
              <DaysCalendar days={1} hidden />
            </View>
          </View>
        )}

        {stats?.liveGames ? <LiveBadge /> : null}
      </View>
    </View>
  );
}

function PaceRow({
  stats,
  recordSeason,
  onExplainPace,
}: {
  stats: HeroStatsData;
  recordSeason: string | null;
  onExplainPace?: () => void;
}) {
  // The web shows games played until the pace parts from the running total.
  const showPace = stats.currentPace !== stats.totalWedgies;
  const games = useCountUp(stats.gamesPlayed);
  const daysAgo = daysSince(stats.lastWedgie);

  return (
    <View style={styles.grid}>
      <View style={styles.gaugeCol}>
        {showPace ? (
          <PaceGauge
            pace={stats.currentPace}
            record={stats.previousRecord}
            recordSeason={recordSeason}
            onExplain={onExplainPace}
          />
        ) : (
          <View style={styles.games}>
            <Text style={styles.gamesNumber} allowFontScaling={false}>
              {games}
            </Text>
            <Text style={styles.gamesLabel} allowFontScaling={false}>
              games played
            </Text>
          </View>
        )}
      </View>
      {daysAgo !== null ? (
        <View style={styles.calendarCol}>
          <DaysCalendar days={Math.max(0, daysAgo)} />
        </View>
      ) : null}
    </View>
  );
}

/** The live badge's own colours: the coffee scoreboard's glass, a pink rim. */
const GLASS = "#0D0620";
const RIM = "#F25CB5";

/**
 * One bounce, 0.9s, as the web's `lb-bounce` keyframes: the ball drops 7pt
 * onto the rim, squashes, kicks up 1pt and rises again. Each leg eases on its
 * own, as a CSS timing function does between keyframes.
 */
const BOUNCE_EASE = Easing.bezier(0.3, 0, 0.7, 1);
const leg = (to: number, duration: number) =>
  withTiming(to, { duration, easing: BOUNCE_EASE });

/**
 * "Night glass": a dark glass pill with cream LIVE GAMES and a little cream
 * ball bouncing on a glowing pink rim. With reduced motion the ball rests on
 * the rim.
 */
function LiveBadge() {
  const still = useReducedMotion();
  // Height above the rim, and how squashed the ball is (0 round, 1 flat).
  const lift = useSharedValue(still ? 0 : -7);
  const squash = useSharedValue(0);

  useEffect(() => {
    if (still) {
      lift.value = 0;
      squash.value = 0;
      return;
    }
    // 0% to 45% falling, 45% to 52% squashing, 52% to 60% kicking up, then
    // rising to the top. The two loops add up to 900ms each so they stay in
    // step.
    lift.value = withRepeat(
      withSequence(leg(0, 405), leg(0, 63), leg(-1, 72), leg(-7, 360)),
      -1,
    );
    squash.value = withRepeat(
      withSequence(leg(0, 405), leg(1, 63), leg(0, 72), leg(0, 360)),
      -1,
    );
    return () => {
      cancelAnimation(lift);
      cancelAnimation(squash);
    };
  }, [still, lift, squash]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { scaleX: 1 + 0.2 * squash.value },
      { scaleY: 1 - 0.22 * squash.value },
    ],
  }));

  return (
    <View
      style={styles.liveBadge}
      accessible
      accessibilityRole="text"
      accessibilityLabel="Live games"
    >
      {/* The glass's faint scanlines, one pale line every 3pt. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern
            id="live-scanlines"
            width={3}
            height={3}
            patternUnits="userSpaceOnUse"
          >
            <Rect width={3} height={1} fill="#FFFFFF" fillOpacity={0.03} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#live-scanlines)" />
      </Svg>
      <View style={styles.liveHoop}>
        <View style={styles.liveRim} />
        <Animated.View style={[styles.liveBall, ballStyle]} />
      </View>
      <Text style={styles.liveText} allowFontScaling={false}>
        LIVE GAMES
      </Text>
    </View>
  );
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

  // Store screenshots only, see lib/screenshot.ts: the stamp on a fresh
  // wedgie is a better first impression than an offseason drought.
  if (SCREENSHOT_MODE) return 0;

  const diff = easternDay(new Date()) - easternDay(last);
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  panelWide: { borderRadius: 22 },
  // `bg-night px-[18px] pt-12 pb-8 min-h-[12em]`
  night: {
    minHeight: 192,
    backgroundColor: colors.night,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingTop: 48,
    // Room for the live badge under the grid, kept whether or not it shows,
    // so a live night does not push the page down when the stats land.
    paddingBottom: 46,
  },
  // Straddles the seam between the badge and the night.
  moreStats: {
    position: "absolute",
    top: -24,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  // `grid-cols-[1.35fr_1fr] items-center gap-3`
  grid: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  gaugeCol: { flex: 1.35 },
  calendarCol: { flex: 1, alignItems: "center" },

  games: {
    backgroundColor: colors.panel,
    borderColor: colors.violet20,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 20,
    alignItems: "center",
  },
  gamesNumber: {
    fontFamily: fonts.blackItalic,
    fontSize: 48,
    lineHeight: 50,
    color: colors.cream,
  },
  gamesLabel: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.cream70,
  },

  // Centred under the pace and calendar, as the site does on phones.
  liveBadge: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(154, 92, 245, 0.4)",
    backgroundColor: GLASS,
    boxShadow: "inset 0 1px 6px rgba(0, 0, 0, 0.6)",
    paddingLeft: 9,
    paddingRight: 13,
    paddingVertical: 6,
  },
  liveHoop: { width: 12, height: 16 },
  liveRim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: RIM,
    boxShadow: "0 0 6px rgba(242, 92, 181, 0.9)",
  },
  liveBall: {
    position: "absolute",
    left: 2,
    bottom: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cream,
    boxShadow: "inset -1px -1px 0 rgba(42, 22, 96, 0.35)",
    // Squash from where it meets the rim.
    transformOrigin: "50% 100%",
  },
  liveText: {
    fontFamily: fonts.black,
    color: colors.cream,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.9,
  },
});
