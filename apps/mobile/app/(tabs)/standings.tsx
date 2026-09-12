import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { Screen, SectionLabel } from "@/components/Screen";
import { Empty, ErrorState, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { colors, radius, space, type } from "@/lib/theme";

export default function StandingsScreen() {
  const standings = api.wedgie.getTopStandings.useQuery();

  return (
    <Screen
      title="Standings"
      subtitle="Current season leaders"
      refreshControl={
        <RefreshControl
          refreshing={standings.isRefetching}
          onRefresh={() => void standings.refetch()}
          tintColor="#EAFF00"
        />
      }
    >
      {standings.isPending ? <Loading label="Loading standings" /> : null}
      {standings.error ? (
        <ErrorState message={standings.error.message} />
      ) : null}

      {standings.data ? (
        <>
          <SectionLabel>Top players</SectionLabel>
          {standings.data.players.length === 0 ? (
            <Empty label="No players ranked yet." />
          ) : (
            standings.data.players.map((player, index) => (
              <Row
                key={player.name ?? index}
                rank={index + 1}
                name={player.name ?? "Unknown"}
                count={player.count}
              />
            ))
          )}

          <SectionLabel>Top teams</SectionLabel>
          {standings.data.teams.length === 0 ? (
            <Empty label="No teams ranked yet." />
          ) : (
            standings.data.teams.map((team, index) => (
              <Row
                key={team.name ?? index}
                rank={index + 1}
                name={team.name ?? "Unknown"}
                count={team.count}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

function Row({
  rank,
  name,
  count,
}: {
  rank: number;
  name: string;
  count: number;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.darkpurpleLight,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  rank: { ...type.label, width: 22, color: colors.faint },
  name: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.white },
  count: { fontSize: 18, fontWeight: "900", color: colors.yellow },
});
