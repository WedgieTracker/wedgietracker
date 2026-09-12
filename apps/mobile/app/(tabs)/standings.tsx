import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Screen } from "@/components/Screen";
import { StandingsList } from "@/components/StandingsList";
import { Empty, ErrorState, Loading } from "@/components/States";
import { api } from "@/lib/api";
import { useSeasonFallback } from "@/lib/use-season-fallback";
import { colors, fonts, radius, space } from "@/lib/theme";

/**
 * Port of apps/web/src/components/standings/StandingsPage.tsx - season filter,
 * the opponent-counting switch, and the full PLAYERS / TEAMS tables.
 */
export default function StandingsScreen() {
  const {
    global,
    seasons,
    defaultSeason,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: isLoadingSeasonData,
  } = useSeasonFallback();

  const [selectedSeason, setSelectedSeason] = useState(defaultSeason);
  const [includeOpponents, setIncludeOpponents] = useState(true);

  useEffect(() => {
    if (shouldShowPreviousSeason && previousSeason) {
      setSelectedSeason(previousSeason.name);
    } else if (global?.currentSeason?.name) {
      setSelectedSeason(global.currentSeason.name);
    }
  }, [shouldShowPreviousSeason, previousSeason, global?.currentSeason?.name]);

  const standings = api.wedgie.getSeasonStandings.useQuery({
    season: selectedSeason,
    includeOpponents,
  });

  const seasonNames = (seasons ?? [])
    .map((s) => s.name)
    .sort()
    .reverse();

  return (
    <Screen
      title="STANDINGS"
      refreshControl={
        <RefreshControl
          refreshing={standings.isRefetching}
          onRefresh={() => void standings.refetch()}
          tintColor={colors.yellow}
        />
      }
    >
      {shouldShowPreviousSeason ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Current season has no wedgies yet. Showing {previousSeason?.name}{" "}
            season standings.
          </Text>
        </View>
      ) : null}

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>FILTER BY ›</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonRow}
        >
          {seasonNames.map((name) => {
            const active = name === selectedSeason;
            return (
              <Pressable
                key={name}
                onPress={() => setSelectedSeason(name)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.toggleRow}>
          <Switch
            value={includeOpponents}
            onValueChange={setIncludeOpponents}
            trackColor={{
              false: colors.darkpurpleLighter,
              true: colors.darkpurpleLighter,
            }}
            thumbColor={includeOpponents ? colors.yellow : colors.pink}
            ios_backgroundColor={colors.darkpurpleLighter}
          />
          <Text style={styles.toggleText}>
            {includeOpponents ? "INCLUDING OPPONENTS" : "PLAYER'S TEAM ONLY"}
          </Text>
        </View>
      </View>

      {standings.isPending || isLoadingSeasonData ? (
        <Loading label="Loading standings" />
      ) : null}
      {standings.error ? (
        <ErrorState message={standings.error.message} />
      ) : null}

      {standings.data ? (
        standings.data.players.length === 0 ? (
          <Empty label={`No wedgies in ${selectedSeason}.`} />
        ) : (
          <View style={styles.grid}>
            <View style={styles.players}>
              <StandingsList title="PLAYERS" items={standings.data.players} />
            </View>
            <View style={styles.teams}>
              <StandingsList title="TEAMS" items={standings.data.teams} />
            </View>
          </View>
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderWidth: 1,
    borderColor: "rgba(255, 0, 255, 0.3)",
    backgroundColor: "rgba(255, 0, 255, 0.2)",
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.lg,
  },
  noticeText: {
    fontFamily: fonts.bold,
    color: colors.pink,
    fontSize: 13,
    textAlign: "center",
  },

  filters: {
    backgroundColor: "rgba(31, 0, 77, 0.4)",
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    marginBottom: space.lg,
  },
  filterLabel: {
    fontFamily: fonts.bold,
    color: colors.yellow,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  seasonRow: { gap: space.sm, paddingRight: space.lg },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: "rgba(234, 255, 0, 0.12)",
  },
  chipActive: { backgroundColor: colors.yellow },
  chipText: { fontFamily: fonts.black, color: colors.yellow, fontSize: 13 },
  chipTextActive: { color: colors.darkpurple },

  toggleRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  toggleText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 10,
    letterSpacing: 0.6,
  },

  grid: { flexDirection: "row", gap: space.lg },
  players: { flex: 3 },
  teams: { flex: 2 },
});
