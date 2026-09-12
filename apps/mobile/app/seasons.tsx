import { Stack, useLocalSearchParams } from "expo-router";
import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { PageHeading } from "@/components/PageHeading";
import { Screen } from "@/components/Screen";
import { Empty, ErrorState, ScreenLoading } from "@/components/States";
import { api } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";

interface Ranked {
  name: string;
  count: number;
}

/**
 * Port of apps/web/src/components/seasons-history - one card per season with
 * its totals and top five players and teams.
 */
export default function SeasonsScreen() {
  // Reachable from the Home hero and from Stats, so the back label has to name
  // whichever one pushed it rather than being fixed in the layout.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const seasons = api.season.getAllWithStats.useQuery();

  const withWedgies = (seasons.data ?? []).filter((s) => s.totalWedgies > 0);

  const backTitle = (
    <Stack.Screen options={{ headerBackTitle: from ?? "Back" }} />
  );

  // The header still needs its label while the first data is loading.
  if (seasons.isPending)
    return (
      <>
        {backTitle}
        <ScreenLoading />
      </>
    );

  return (
    <>
      {backTitle}
      <Screen
        heading={
          <PageHeading
            top="Seasons"
            bottom="History"
            base={36}
            bottomScale={1.1}
            liftEm={0.3}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={seasons.isRefetching}
            onRefresh={() => void seasons.refetch()}
            tintColor={colors.yellow}
          />
        }
      >
        {seasons.error ? <ErrorState message={seasons.error.message} /> : null}
        {seasons.data && withWedgies.length === 0 ? (
          <Empty label="No seasons with wedgies yet." />
        ) : null}

        {withWedgies.map((season) => (
          <View key={season.name} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.seasonName} allowFontScaling={false}>
                {season.name}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText} allowFontScaling={false}>
                  SEASON
                </Text>
              </View>
            </View>

            <View style={styles.totals}>
              <Totals value={season.totalWedgies} label="Total Wedgies" />
              <Totals value={season.totalGames} label="Games Played" />
            </View>

            <View style={styles.grid}>
              <View style={styles.players}>
                <RankedList title="PLAYERS" items={season.topPlayers} />
              </View>
              <View style={styles.teams}>
                <RankedList title="TEAMS" items={season.topTeams} />
              </View>
            </View>
          </View>
        ))}
      </Screen>
    </>
  );
}

function Totals({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.total}>
      <Text style={styles.totalValue} allowFontScaling={false}>
        {value}
      </Text>
      <Text style={styles.totalLabel} allowFontScaling={false}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

/** The season cards rank by position rather than sharing ranks on ties. */
function RankedList({ title, items }: { title: string; items: Ranked[] }) {
  return (
    <View>
      <Text style={styles.listTitle} allowFontScaling={false}>
        {title}
      </Text>
      <View style={styles.listRows}>
        {items.map((item, index) => (
          <View key={item.name} style={styles.listRow}>
            <View style={styles.listLeft}>
              <Text style={styles.rank} allowFontScaling={false}>
                <Text style={styles.rankHash}>#</Text>
                {index + 1}
              </Text>
              <Text numberOfLines={1} style={styles.listName}>
                {item.name}
              </Text>
            </View>
            <Text style={styles.listCount} allowFontScaling={false}>
              {item.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkpurple,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.lg,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  seasonName: { fontFamily: fonts.black, color: colors.yellow, fontSize: 26 },
  badge: {
    backgroundColor: "rgba(234, 255, 0, 0.2)",
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fonts.black,
    color: colors.yellow,
    fontSize: 10,
    letterSpacing: 1.2,
  },

  totals: { flexDirection: "row", gap: space.xl },
  total: { flex: 1 },
  totalValue: { fontFamily: fonts.black, color: colors.pink, fontSize: 44 },
  totalLabel: {
    fontFamily: fonts.bold,
    color: colors.white50,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 2,
  },

  grid: { flexDirection: "row", gap: space.lg },
  players: { flex: 3 },
  teams: { flex: 2 },
  listTitle: {
    fontFamily: fonts.black,
    color: colors.yellow,
    fontSize: 15,
    marginBottom: space.sm,
  },
  listRows: { gap: 3 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    flexShrink: 1,
  },
  rank: { fontFamily: fonts.black, color: colors.pink, fontSize: 14 },
  rankHash: { color: "rgba(255, 0, 255, 0.5)", fontSize: 11 },
  listName: {
    fontFamily: fonts.black,
    color: colors.white,
    fontSize: 14,
    flexShrink: 1,
  },
  listCount: { fontFamily: fonts.black, color: colors.yellow, fontSize: 14 },
});
