import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useCountUp } from "@/components/Counter";
import { DaysCalendar } from "@/components/DaysCalendar";
import { PaceGauge } from "@/components/PaceGauge";
import { StickerButton } from "@/components/StickerButton";
import { WaveCounterPanel } from "@/components/WaveCounterPanel";
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
}: {
  stats: HeroStatsData | null;
  /** Which season set the record, when the stats do not say. */
  recordSeason?: string | null;
  onMoreStats: () => void;
}) {
  const { height } = useWindowDimensions();

  return (
    <View>
      <WaveCounterPanel
        value={stats?.totalWedgies ?? null}
        previousRecord={stats?.previousRecord ?? Number.POSITIVE_INFINITY}
        // `min-h-[25em] flex-2` of an `80svh` column on a phone.
        minHeight={Math.max(400, height * 0.5)}
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

        {stats?.liveGames ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText} allowFontScaling={false}>
              LIVE GAMES
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PaceRow({
  stats,
  recordSeason,
}: {
  stats: HeroStatsData;
  recordSeason: string | null;
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
    gap: space.sm,
    borderRadius: 999,
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
