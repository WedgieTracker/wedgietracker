import { RefreshControl, StyleSheet, View } from "react-native";

import { Screen } from "@/components/Screen";
import { StandingsList } from "@/components/StandingsList";
import { Empty, ErrorState, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { colors, radius, space } from "@/lib/theme";

/**
 * The standings card from the home page, given the whole screen - PLAYERS and
 * TEAMS side by side, same 3/2 split as apps/web/src/components/home/Standings.tsx.
 */
export default function StandingsScreen() {
  const standings = api.wedgie.getTopStandings.useQuery();

  return (
    <Screen
      title="STANDINGS"
      subtitle="Current season leaders"
      refreshControl={
        <RefreshControl
          refreshing={standings.isRefetching}
          onRefresh={() => void standings.refetch()}
          tintColor={colors.yellow}
        />
      }
    >
      {standings.isPending ? <Loading label="Loading standings" /> : null}
      {standings.error ? (
        <ErrorState message={standings.error.message} />
      ) : null}

      {standings.data ? (
        standings.data.hasWedgiesThisSeason ? (
          <View style={styles.card}>
            <View style={styles.players}>
              <StandingsList title="PLAYERS" items={standings.data.players} />
            </View>
            <View style={styles.teams}>
              <StandingsList title="TEAMS" items={standings.data.teams} />
            </View>
          </View>
        ) : (
          <Empty label="No wedgies yet this season." />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: space.xl,
    backgroundColor: colors.rowIdle,
    borderRadius: radius.sm,
    padding: space.md,
  },
  players: { flex: 3 },
  teams: { flex: 2 },
});
