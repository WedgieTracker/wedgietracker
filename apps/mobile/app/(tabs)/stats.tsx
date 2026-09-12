import { useRouter } from "expo-router";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PageHeading } from "@/components/PageHeading";
import { PillButton } from "@/components/PillButton";
import { ErrorState, ScreenLoading } from "@/components/States";
import { TypingStats } from "@/components/TypingStats";
import { WaveCounterPanel } from "@/components/WaveCounterPanel";
import { useFluidType } from "@/lib/fluid";
import { useTabBarClearance } from "@/lib/layout";
import { api, type RouterOutputs } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";

type NerdStats = RouterOutputs["wedgie"]["getNerdStats"];

/**
 * Port of apps/web/src/components/stats-for-nerds/StatsForNerds.tsx.
 */
export default function StatsScreen() {
  const nerd = api.wedgie.getNerdStats.useQuery();
  const tabBar = useTabBarClearance();

  if (nerd.isPending) return <ScreenLoading />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBar }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={nerd.isRefetching}
            onRefresh={() => void nerd.refetch()}
            tintColor={colors.yellow}
          />
        }
      >
        {nerd.error ? (
          <View style={styles.padded}>
            <ErrorState message={nerd.error.message} />
          </View>
        ) : null}

        {nerd.data ? <NerdContent stats={nerd.data} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function NerdContent({ stats }: { stats: NerdStats }) {
  const router = useRouter();

  return (
    <>
      <View style={styles.headingWrap}>
        <PageHeading
          top="Stats"
          bottom="For Nerds"
          base={60}
          bottomScale={0.6}
          liftEm={0.4}
        />
      </View>

      <View style={styles.seasonHeader}>
        <Text style={styles.seasonHeaderText} allowFontScaling={false}>
          IN THE{" "}
        </Text>
        <View style={styles.seasonChip}>
          <Text style={styles.seasonChipText} allowFontScaling={false}>
            {stats.currentSeason}
          </Text>
        </View>
        <Text style={styles.seasonHeaderText} allowFontScaling={false}>
          {" "}
          SEASON
        </Text>
      </View>

      <View style={styles.blocks}>
        <View style={styles.counterGroup}>
          <WaveCounterPanel
            value={stats.wedgiesThisSeason}
            previousRecord={stats.previousRecord}
            minHeight={300}
          />
          <TypingStats stats={stats.statsPerWedgie} />
        </View>

        <SeasonComparison stats={stats} />
        <LastWedgie
          stats={stats}
          onViewAll={() => router.push("/all-wedgies")}
        />
        <Leaders stats={stats} onStandings={() => router.push("/standings")} />
        <SeasonTotals
          stats={stats}
          onSeasonsHistory={() => router.push("/seasons")}
        />
      </View>
    </>
  );
}

function SeasonComparison({ stats }: { stats: NerdStats }) {
  const t = useFluidType();
  const showPace = stats.pace !== stats.wedgiesThisSeason;
  const isMatchingAverage = stats.pace === stats.averageLastTenSeasons;
  const diff = Math.abs(stats.pace - stats.averageLastTenSeasons);
  const isMore = stats.pace > stats.averageLastTenSeasons;

  return (
    <View style={styles.block}>
      {showPace ? (
        <View style={styles.centered}>
          <Text
            style={[styles.paceLabel, tight(t.paceText)]}
            allowFontScaling={false}
          >
            PACE
          </Text>
          <Text
            style={[
              styles.paceNumber,
              tight(t.paceNumber),
              // Matches the home hero's slightly eased overlap
              { marginTop: -0.12 * t.paceNumber },
            ]}
            allowFontScaling={false}
          >
            {stats.pace.toFixed(0)}
          </Text>
        </View>
      ) : isMatchingAverage ? null : (
        <View style={styles.centered}>
          <Text
            style={[styles.paceNumber, tight(t.paceNumber)]}
            allowFontScaling={false}
          >
            {diff}
          </Text>
          <Text
            style={[
              styles.paceLabel,
              tight(t.paceText),
              // `mt-[-.6em]` on the web
              { marginTop: -0.6 * t.paceText },
            ]}
            allowFontScaling={false}
          >
            {isMore ? "MORE" : "LESS"}
          </Text>
        </View>
      )}

      <Text style={styles.sentence}>
        {isMatchingAverage ? (
          <>
            WE ARE ON PACE TO MATCH THE AVERAGE OF{" "}
            <Text style={styles.pinkBold}>{stats.averageLastTenSeasons}</Text>{" "}
            OF THE PAST <Text style={styles.pinkBold}>11 SEASONS</Text>
          </>
        ) : showPace ? (
          <>
            IT IS <Text style={styles.pinkBold}>{diff}</Text>{" "}
            {isMore ? "MORE" : "LESS"} THAN THE AVERAGE OF{" "}
            <Text style={styles.pinkBold}>{stats.averageLastTenSeasons}</Text>{" "}
            OF THE PAST <Text style={styles.pinkBold}>11 SEASONS</Text>
          </>
        ) : (
          <>
            THAN THE AVERAGE OF{" "}
            <Text style={styles.pinkBold}>{stats.averageLastTenSeasons}</Text>{" "}
            OF THE PAST <Text style={styles.pinkBold}>11 SEASONS</Text>
          </>
        )}
      </Text>
    </View>
  );
}

function LastWedgie({
  stats,
  onViewAll,
}: {
  stats: NerdStats;
  onViewAll: () => void;
}) {
  if (!stats.lastWedgiePlayer || stats.gamesSinceLastWedgie === undefined) {
    return null;
  }

  return (
    <View style={styles.group}>
      <View style={styles.groupBody}>
        <View style={styles.gamesRow}>
          <View style={styles.gamesBadge}>
            <Text style={styles.gamesBadgeText} allowFontScaling={false}>
              {stats.gamesSinceLastWedgie}
            </Text>
          </View>
          <Text style={styles.sentence}>GAMES PLAYED</Text>
        </View>
        <Text style={styles.sentence}>SINCE THE LAST</Text>
        <Text style={styles.playerName} allowFontScaling={false}>
          {stats.lastWedgiePlayer.toUpperCase()}&apos;S
        </Text>
        <Text style={styles.sentence}>WEDGIE</Text>
      </View>
      <PillButton label="VIEW ALL WEDGIES" variant="bar" onPress={onViewAll} />
    </View>
  );
}

function Leaders({
  stats,
  onStandings,
}: {
  stats: NerdStats;
  onStandings: () => void;
}) {
  if (stats.wedgiesThisSeason === 0) {
    return <PillButton label="SEE STANDINGS" onPress={onStandings} />;
  }

  const maxWedgies = stats.leaders.teams[0]?.wedgies ?? 0;
  const leadingTeams = stats.leaders.teams.flatMap((team) =>
    team.wedgies === maxWedgies ? [team.name] : [],
  );
  const players = stats.leaders.players;

  return (
    <View style={styles.group}>
      <View style={styles.groupBody}>
        <View style={styles.chipSentence}>
          {leadingTeams.map((team) => (
            <Chip key={team} label={team} />
          ))}
          <Text style={styles.sentence}>
            {leadingTeams.length > 1
              ? " ARE TIED FOR THE LEAD WITH "
              : " CURRENTLY LEADS THE NBA WITH "}
            <Text style={styles.pink}>#{maxWedgies}</Text> WEDGIES
            {leadingTeams.length > 1 ? "" : " FOR THE SEASON"}
          </Text>
        </View>

        <Text style={[styles.sentence, styles.spaced]}>
          AND THE LEADING PLAYER{players.length > 1 ? "S" : ""} WITH{" "}
          <Text style={styles.pink}>#{players[0]?.count ?? 0}</Text>{" "}
          {players.length > 1 ? "ARE" : "IS"}
        </Text>

        <View style={styles.chipSentence}>
          {players.map((p) => (
            <Chip key={p.name} label={p.name} />
          ))}
        </View>
      </View>
      <PillButton label="SEE STANDINGS" variant="bar" onPress={onStandings} />
    </View>
  );
}

function SeasonTotals({
  stats,
  onSeasonsHistory,
}: {
  stats: NerdStats;
  onSeasonsHistory: () => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupBody}>
        {/* Three lines, as the web breaks them. */}
        <Text style={styles.sentence}>
          <Text style={styles.pink}>{stats.totalWedgiesOverall}</Text> TOTAL
          WEDGIES
        </Text>
        <Text style={styles.sentence}>
          TRACKED OVER{" "}
          <Text style={styles.pink}>{stats.totalSeasonsOverall}</Text> SEASONS
        </Text>
        <Text style={styles.sentence}>
          OR{" "}
          <Text style={styles.pink}>
            {stats.totalGamesOverall.toLocaleString()}
          </Text>{" "}
          GAMES
        </Text>
      </View>
      <PillButton
        label="SEE SEASONS HISTORY"
        variant="bar"
        onPress={onSeasonsHistory}
      />
    </View>
  );
}

/** `leading-none`, so the labels can overlap the numbers as they do on the site. */
function tight(fontSize: number) {
  return { fontSize, lineHeight: fontSize };
}

/** The pink rounded team/player token used throughout the page. */
function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkpurple },
  content: {},
  padded: { padding: space.lg },

  headingWrap: { paddingTop: space.lg },
  seasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    paddingVertical: space.lg,
  },
  seasonHeaderText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 17,
  },
  seasonChip: {
    backgroundColor: colors.pink,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 1,
  },
  seasonChipText: {
    fontFamily: fonts.black,
    color: colors.darkpurple,
    fontSize: 17,
  },

  // The counter and the typewriter read as one card, clipped together.
  counterGroup: { borderRadius: radius.xl, overflow: "hidden" },

  blocks: { padding: space.lg, gap: space.xl },
  block: {
    backgroundColor: colors.darkpurpleDark,
    borderRadius: radius.xl,
    padding: space.lg,
    alignItems: "center",
    gap: space.sm,
  },
  centered: { alignItems: "center" },

  group: {
    backgroundColor: colors.darkpurpleDark,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    overflow: "hidden",
  },
  groupBody: { padding: space.lg, alignItems: "center", gap: space.xs },

  paceLabel: {
    fontFamily: fonts.black,
    color: colors.pink,
    letterSpacing: 1.5,
  },
  paceNumber: { fontFamily: fonts.black, color: colors.yellow },

  sentence: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 17,
    textAlign: "center",
    lineHeight: 24,
  },
  spaced: { marginVertical: space.sm },
  pink: { color: colors.pink },
  pinkBold: { fontFamily: fonts.black, color: colors.pink },

  gamesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginBottom: space.xs,
  },
  gamesBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.yellow,
    backgroundColor: colors.darkpurple,
    alignItems: "center",
    justifyContent: "center",
  },
  gamesBadgeText: {
    fontFamily: fonts.black,
    color: colors.yellow,
    fontSize: 20,
  },
  playerName: { fontFamily: fonts.black, color: colors.yellow, fontSize: 22 },

  chipSentence: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  chip: {
    backgroundColor: colors.pink,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 1,
  },
  chipText: {
    fontFamily: fonts.black,
    color: colors.darkpurple,
    fontSize: 17,
  },
});
