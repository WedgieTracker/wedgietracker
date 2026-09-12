import { RefreshControl, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Empty, ErrorState, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { colors, fonts, radius, space, type } from "@/lib/theme";

export default function SeasonsScreen() {
  const seasons = api.season.getAllWithStats.useQuery();

  return (
    <Screen
      title="SEASONS"
      subtitle="Every season on record"
      refreshControl={
        <RefreshControl
          refreshing={seasons.isRefetching}
          onRefresh={() => void seasons.refetch()}
          tintColor="#EAFF00"
        />
      }
    >
      {seasons.isPending ? <Loading label="Loading seasons" /> : null}
      {seasons.error ? <ErrorState message={seasons.error.message} /> : null}
      {seasons.data?.length === 0 ? <Empty label="No seasons yet." /> : null}

      {seasons.data?.map((season) => (
        <View key={season.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.seasonName}>{season.name}</Text>
            <Text style={styles.total}>{season.totalWedgies}</Text>
          </View>

          {season.topPlayers.length > 0 ? (
            <View style={styles.list}>
              <Text style={styles.listLabel}>TOP PLAYERS</Text>
              {season.topPlayers.map((player, index) => (
                <Text
                  key={player.name ?? index}
                  style={styles.listItem}
                  numberOfLines={1}
                >
                  {player.name ?? "Unknown"}
                  <Text style={styles.listCount}> {player.count}</Text>
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.lg,
    marginBottom: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.rowIdle,
    gap: space.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  seasonName: { ...type.title, fontSize: 22, color: colors.white },
  total: { ...type.stat, color: colors.yellow },
  list: { gap: space.xs },
  listLabel: { ...type.label, fontSize: 10, color: colors.faint },
  listItem: { ...type.body, color: colors.muted },
  listCount: { fontFamily: fonts.black, color: colors.pink },
});
