import { StyleSheet, Text, View } from "react-native";

import { useCountUp } from "@/components/Counter";
import { PillButton } from "@/components/PillButton";
import { WaveCounterPanel } from "@/components/WaveCounterPanel";
import { useFluidType } from "@/lib/fluid";
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

  return (
    <View style={styles.pacePanel}>
      <View style={styles.moreStatsWrap}>
        <PillButton label="MORE STATS" onPress={onMoreStats} />
      </View>

      <View style={[styles.paceRow, !showPace && styles.paceRowStacked]}>
        <View style={[styles.paceColumn, !showPace && styles.paceColumnWide]}>
          <Text
            style={[
              styles.paceLabel,
              showPace ? { fontSize: t.paceText } : styles.paceLabelSmall,
            ]}
            allowFontScaling={false}
          >
            {showPace ? "PACE" : "GAMES"}
          </Text>
          <Text
            style={[
              styles.paceNumber,
              showPace ? { fontSize: t.paceNumber } : styles.paceNumberSmall,
            ]}
            allowFontScaling={false}
          >
            {paceValue}
          </Text>
        </View>

        {daysAgo !== null && daysAgo > 0 ? (
          <View style={styles.droughtRow}>
            <View style={styles.droughtCount}>
              <Text style={styles.droughtNumber} allowFontScaling={false}>
                {daysAgo}
              </Text>
              <Text style={styles.droughtUnit} allowFontScaling={false}>
                {daysAgo === 1 ? "day" : "days"}
              </Text>
            </View>
            <Text style={styles.droughtLabel} allowFontScaling={false}>
              WITHOUT{"\n"}WEDGIES
            </Text>
          </View>
        ) : (
          <View style={styles.freshRow}>
            <Text style={styles.freshNew} allowFontScaling={false}>
              NEW
            </Text>
            <Text style={styles.freshWedgie} allowFontScaling={false}>
              WEDGIE
            </Text>
          </View>
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

  const diff = easternDay(new Date()) - easternDay(last);
  return Math.round(diff / (1000 * 60 * 60 * 24));
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
  paceLabelSmall: { fontSize: 20 },
  paceNumber: {
    fontFamily: fonts.black,
    color: colors.yellow,
    textAlign: "center",
  },
  paceNumberSmall: { fontSize: 48 },

  droughtRow: {
    width: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  droughtCount: { alignItems: "center" },
  droughtNumber: {
    fontFamily: fonts.black,
    color: colors.yellow,
    fontSize: 48,
  },
  droughtUnit: {
    fontFamily: fonts.black,
    color: colors.pink,
    fontSize: 14,
    marginTop: -6,
  },
  droughtLabel: {
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: 0.8,
    fontSize: 14,
  },

  freshRow: { width: 140, alignItems: "center" },
  freshNew: { fontFamily: fonts.black, color: colors.pink, fontSize: 36 },
  freshWedgie: {
    fontFamily: fonts.black,
    color: colors.yellow,
    fontSize: 29,
    marginTop: -8,
  },

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
