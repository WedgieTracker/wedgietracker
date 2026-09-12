import { keepPreviousData } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCountUp } from "@/components/Counter";
import { FilterSelect } from "@/components/FilterSelect";
import { PageHeading } from "@/components/PageHeading";
import { Empty, ErrorState, ScreenLoading } from "@/components/States";
import { WedgieRow } from "@/components/WedgieRow";
import { api } from "@/lib/api";
import { useSeasonFallback } from "@/lib/use-season-fallback";
import { colors, fonts, radius, space } from "@/lib/theme";
import { matchesFilter } from "@wedgietracker/core/utils/wedgieFilter";

/**
 * Port of apps/web/src/components/all-wedgies - the full list with the season,
 * type and team/player filters, and the running count of what is visible.
 */
export default function AllWedgiesScreen() {
  const router = useRouter();
  const {
    global,
    defaultSeason,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: isLoadingSeasonData,
  } = useSeasonFallback();

  // Standings rows link here with a player/team and optionally a season, the
  // same `wp` / `wt` / `ws` params the web page reads off the URL.
  const params = useLocalSearchParams<{
    wp?: string;
    wt?: string;
    ws?: string;
  }>();
  const hasSeasonFromUrl = params.ws !== undefined;

  const [season, setSeason] = useState(
    params.ws === "all" ? "" : (params.ws ?? defaultSeason),
  );
  const [type, setType] = useState("");
  const [playerOrTeam, setPlayerOrTeam] = useState(
    params.wp ?? params.wt ?? "",
  );

  // Re-apply whenever we are navigated to with a new filter.
  useEffect(() => {
    setPlayerOrTeam(params.wp ?? params.wt ?? "");
    if (params.ws !== undefined) {
      setSeason(params.ws === "all" ? "" : params.ws);
    }
  }, [params.wp, params.wt, params.ws]);

  useEffect(() => {
    if (hasSeasonFromUrl) return;
    if (shouldShowPreviousSeason && previousSeason) {
      setSeason(previousSeason.name);
    } else if (global?.currentSeason?.name) {
      setSeason(global.currentSeason.name);
    }
  }, [
    shouldShowPreviousSeason,
    previousSeason,
    global?.currentSeason?.name,
    hasSeasonFromUrl,
  ]);

  // The web app queries by season when one is picked, and everything otherwise.
  const all = api.wedgie.getAll.useQuery();
  const bySeason = api.wedgie.getBySeason.useQuery(
    { season },
    { enabled: !!season, placeholderData: keepPreviousData },
  );

  const source = season ? bySeason.data : all.data;
  const isPending = season ? bySeason.isPending : all.isPending;
  const error = season ? bySeason.error : all.error;

  const seasons = useMemo(
    () =>
      Array.from(
        new Set(
          (all.data ?? []).flatMap((w) => (w.seasonName ? [w.seasonName] : [])),
        ),
      )
        .sort()
        .reverse(),
    [all.data],
  );

  const types = useMemo(
    () =>
      Array.from(
        new Set(
          (all.data ?? []).flatMap((w) =>
            (w.types ?? []).flatMap((t) => (t.name ? [t.name] : [])),
          ),
        ),
      ).sort(),
    [all.data],
  );

  const wedgies = useMemo(() => {
    const rows = (source ?? []).filter((w) =>
      matchesFilter(w, { type, playerOrTeam }),
    );
    return rows.sort(
      (a, b) =>
        new Date(b.wedgieDate).getTime() - new Date(a.wedgieDate).getTime(),
    );
  }, [source, type, playerOrTeam]);

  const visible = useCountUp(wedgies.length, 200);

  if (isPending || isLoadingSeasonData) return <ScreenLoading />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={wedgies}
        keyExtractor={(w) => String(w.id)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={all.isRefetching || bySeason.isRefetching}
            onRefresh={() => {
              void all.refetch();
              if (season) void bySeason.refetch();
            }}
            tintColor={colors.yellow}
          />
        }
        ListHeaderComponent={
          <View>
            <PageHeading
              top="All"
              bottom="Wedgies"
              base={60}
              bottomScale={0.5}
              liftEm={0.4}
            />

            {shouldShowPreviousSeason ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Current season has no wedgies yet. Showing{" "}
                  {previousSeason?.name} season wedgies.
                </Text>
              </View>
            ) : null}

            <View style={styles.filters}>
              <View style={styles.filterHead}>
                <Text style={styles.filterLabel}>FILTER BY ›</Text>
                <View style={styles.counter}>
                  <Text style={styles.counterValue} allowFontScaling={false}>
                    {visible}
                  </Text>
                  <Text style={styles.counterLabel} allowFontScaling={false}>
                    TOTAL
                  </Text>
                </View>
              </View>

              <View style={styles.selects}>
                <FilterSelect
                  label="Season"
                  value={season}
                  options={[
                    { value: "", label: "All Seasons" },
                    ...seasons.map((name) => ({ value: name, label: name })),
                  ]}
                  onSelect={setSeason}
                />
                <FilterSelect
                  label="Type"
                  value={type}
                  options={[
                    { value: "", label: "All Types" },
                    ...types.map((name) => ({ value: name, label: name })),
                  ]}
                  onSelect={setType}
                  tone="pink"
                />
              </View>

              <TextInput
                value={playerOrTeam}
                onChangeText={setPlayerOrTeam}
                placeholder="Search teams or players..."
                placeholderTextColor="rgba(18, 0, 46, 0.5)"
                style={styles.search}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {error ? <ErrorState message={error.message} /> : null}
            {wedgies.length === 0 ? (
              <Empty label="No wedgies match those filters." />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <WedgieRow
            wedgie={item}
            variant="small"
            onPress={() => router.push(`/wedgie/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkpurpleDark },
  screen: { flex: 1, backgroundColor: colors.darkpurpleDark },
  content: { padding: space.lg, paddingBottom: space.xxl },

  notice: {
    borderWidth: 1,
    borderColor: "rgba(255, 0, 255, 0.3)",
    backgroundColor: "rgba(255, 0, 255, 0.2)",
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
  },
  noticeText: {
    fontFamily: fonts.bold,
    color: colors.pink,
    fontSize: 13,
    textAlign: "center",
  },

  selects: { flexDirection: "row", gap: space.sm },
  filters: {
    backgroundColor: "rgba(31, 0, 77, 0.4)",
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
    marginBottom: space.lg,
  },
  filterHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabel: {
    fontFamily: fonts.bold,
    color: colors.yellow,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  counter: { alignItems: "center" },
  counterValue: { fontFamily: fonts.black, color: colors.yellow, fontSize: 30 },
  counterLabel: {
    fontFamily: fonts.black,
    color: colors.pink,
    fontSize: 11,
    marginTop: -4,
  },

  search: {
    backgroundColor: colors.yellow,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontFamily: fonts.bold,
    color: colors.darkpurple,
    fontSize: 15,
  },
});
