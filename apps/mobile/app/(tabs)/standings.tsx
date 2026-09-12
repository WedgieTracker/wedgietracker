import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Switch, Text, View } from "react-native";

import { ClearFilters, FilterSelect } from "@/components/FilterSelect";
import { PageHeading } from "@/components/PageHeading";
import { Screen } from "@/components/Screen";
import { StandingsList } from "@/components/StandingsList";
import { Empty, ErrorState, ScreenLoading } from "@/components/States";
import { api } from "@/lib/api";
import { useSeasonFallback } from "@/lib/use-season-fallback";
import { colors, fonts, radius, space } from "@/lib/theme";

/**
 * Port of apps/web/src/components/standings/StandingsPage.tsx - season filter,
 * the opponent-counting switch, and the full PLAYERS / TEAMS tables.
 */
export default function StandingsScreen() {
  const router = useRouter();
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
  // A hand-picked season has to survive the effect below, which otherwise
  // reasserts the default every time the season data settles.
  const [seasonTouched, setSeasonTouched] = useState(false);

  // There is no "all seasons" option here, so the season the page opens on is
  // the thing reset returns to, and both this and reset read it from one place.
  const initialSeason =
    (shouldShowPreviousSeason ? previousSeason?.name : undefined) ??
    global?.currentSeason?.name ??
    defaultSeason;

  useEffect(() => {
    if (seasonTouched) return;
    setSelectedSeason(initialSeason);
  }, [initialSeason, seasonTouched]);

  const isFiltered = selectedSeason !== initialSeason || !includeOpponents;

  const resetFilters = () => {
    setSeasonTouched(false);
    setSelectedSeason(initialSeason);
    setIncludeOpponents(true);
  };

  const standings = api.wedgie.getSeasonStandings.useQuery(
    { season: selectedSeason, includeOpponents },
    // Changing a filter makes a new query key; without this the table blanks
    // and everything below it jumps while the next one loads.
    { placeholderData: keepPreviousData },
  );

  const seasonNames = (seasons ?? [])
    .map((s) => s.name)
    .sort()
    .reverse();

  // Nothing renders until the first table is ready, so the filters do not
  // appear over an empty page and then shove it down.
  if (standings.isPending || isLoadingSeasonData) return <ScreenLoading />;

  return (
    <Screen
      heading={
        <PageHeading
          top="Players/Teams"
          bottom="Standings"
          base={24}
          bottomScale={1.5}
          liftEm={0.25}
        />
      }
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

        {/* Side by side, as the two filter cards sit on the web. */}
        <View style={styles.filterRow}>
          <FilterSelect
            label="Season"
            value={selectedSeason}
            options={seasonNames.map((name) => ({ value: name, label: name }))}
            onSelect={(next) => {
              setSeasonTouched(true);
              setSelectedSeason(next);
            }}
          />

          <View style={styles.toggleCard}>
            <Text style={styles.toggleLabel} allowFontScaling={false}>
              Team Counting
            </Text>
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
                style={styles.switch}
              />
              <Text style={styles.toggleText}>
                {includeOpponents
                  ? "INCLUDING OPPONENTS"
                  : "PLAYER'S TEAM ONLY"}
              </Text>
            </View>
          </View>
        </View>

        {isFiltered ? (
          <ClearFilters label="RESET FILTERS" onPress={resetFilters} />
        ) : null}
      </View>

      {standings.error ? (
        <ErrorState message={standings.error.message} />
      ) : null}

      {standings.data ? (
        standings.data.players.length === 0 ? (
          <Empty label={`No wedgies in ${selectedSeason}.`} />
        ) : (
          <View style={styles.grid}>
            <View style={styles.players}>
              <StandingsList
                title="PLAYERS"
                items={standings.data.players}
                onPressItem={(name) =>
                  router.push({
                    pathname: "/all-wedgies",
                    params: { wp: name, ws: selectedSeason || "all" },
                  })
                }
              />
            </View>
            <View style={styles.teams}>
              <StandingsList
                title="TEAMS"
                items={standings.data.teams}
                onPressItem={(name) =>
                  router.push({
                    pathname: "/all-wedgies",
                    params: { wt: name, ws: selectedSeason || "all" },
                  })
                }
              />
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

  filterRow: { flexDirection: "row", gap: space.sm, alignItems: "stretch" },
  // Mirrors FilterSelect's card so the pair reads as one control group.
  toggleCard: {
    flex: 1,
    backgroundColor: "rgba(234, 255, 0, 0.12)",
    borderRadius: radius.sm,
    padding: space.sm,
    gap: space.sm,
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontFamily: fonts.bold,
    color: colors.yellow,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  switch: { transform: [{ scale: 0.8 }] },
  toggleText: {
    // Wraps rather than clipping, like the web's fixed-width `w-16` label.
    flex: 1,
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 10,
    letterSpacing: 0.4,
  },

  grid: { flexDirection: "row", gap: space.lg },
  players: { flex: 3 },
  teams: { flex: 2 },
});
