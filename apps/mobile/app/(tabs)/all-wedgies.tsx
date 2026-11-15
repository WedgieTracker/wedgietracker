import { keepPreviousData } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Empty, ErrorState } from "@/components/States";
import { TopSafeArea } from "@/components/TopSafeArea";
import { SupportFooter } from "@/components/SupportFooter";
import {
  NO_FILTERS,
  WedgieFilters,
  type Filters,
} from "@/components/WedgieFilters";
import {
  WEDGIE_ROW_HEIGHT,
  WedgieRow,
  WedgieRowPlaceholder,
} from "@/components/WedgieRow";
import { api } from "@/lib/api";
import { useTabBarClearance } from "@/lib/layout";
import { useShotScroll } from "@/lib/screenshot";
import { useSeasonFallback } from "@/lib/use-season-fallback";
import { useWide } from "@/lib/wide";
import { colors, fonts } from "@/lib/theme";
import { matchesFilter } from "@wedgietracker/core/utils/wedgieFilter";

const GAP = 12;

/**
 * Port of apps/web/src/components/all-wedgies: the heading with its live
 * count, the filters, and every wedgie that matches.
 */
export default function AllWedgiesScreen() {
  const router = useRouter();
  const tabBar = useTabBarClearance();
  const shotRef = useRef<FlatList>(null);
  useShotScroll(shotRef);
  const { wide, width } = useWide();
  // Two rows side by side, each half the content less half the gap.
  const cellWidth = (Math.min(width, 1000) - 32 - GAP) / 2;
  const cell = wide ? { width: cellWidth } : undefined;
  const {
    global,
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

  const [filters, setFilters] = useState<Filters>(() => ({
    ...NO_FILTERS,
    season: params.ws === "all" ? "" : (params.ws ?? ""),
    playerOrTeam: params.wp ?? params.wt ?? "",
  }));
  // Once the season has been chosen by hand, or cleared, the default-season
  // effect below must stop reasserting itself.
  const [seasonTouched, setSeasonTouched] = useState(params.ws !== undefined);

  // Re-apply whenever we are navigated to with a new filter.
  useEffect(() => {
    if (
      params.wp === undefined &&
      params.wt === undefined &&
      params.ws === undefined
    )
      return;
    setFilters((prev) => ({
      ...prev,
      playerOrTeam: params.wp ?? params.wt ?? "",
      ...(params.ws !== undefined
        ? { season: params.ws === "all" ? "" : params.ws }
        : {}),
    }));
    if (params.ws !== undefined) setSeasonTouched(true);
  }, [params.wp, params.wt, params.ws]);

  // The page opens on the current season, or the last one with wedgies when
  // the current one has none yet.
  const openingSeason =
    (shouldShowPreviousSeason ? previousSeason?.name : undefined) ??
    global?.currentSeason?.name;
  useEffect(() => {
    if (seasonTouched || !openingSeason) return;
    setFilters((prev) => ({ ...prev, season: openingSeason }));
  }, [openingSeason, seasonTouched]);

  const onChange = (next: Filters) => {
    if (next.season !== filters.season) setSeasonTouched(true);
    setFilters(next);
  };

  // The web app queries by season when one is picked, and everything otherwise.
  const all = api.wedgie.getAll.useQuery();
  const bySeason = api.wedgie.getBySeason.useQuery(
    { season: filters.season },
    { enabled: !!filters.season, placeholderData: keepPreviousData },
  );

  const source = filters.season ? bySeason.data : all.data;
  const isPending = filters.season ? bySeason.isPending : all.isPending;
  const error = filters.season ? bySeason.error : all.error;

  const wedgies = useMemo(() => {
    const rows = (source ?? []).filter((w) => matchesFilter(w, filters));
    return rows.sort(
      (a, b) =>
        new Date(b.wedgieDate).getTime() - new Date(a.wedgieDate).getTime() ||
        b.number - a.number,
    );
  }, [source, filters]);

  // Until the opening season is applied, the list would show every season for
  // a frame and then swap, so that counts as loading too.
  const seasonPending =
    !seasonTouched && !!openingSeason && filters.season !== openingSeason;
  const loading =
    isPending || all.isPending || isLoadingSeasonData || seasonPending;

  if (loading) {
    return (
      <TopSafeArea style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBar }]}
          scrollEnabled={false}
        >
          <WedgieFilters
            filters={NO_FILTERS}
            onChange={() => undefined}
            visible={null}
            all={null}
          />
          <View style={[styles.list, wide && styles.listWide]}>
            {Array.from({ length: 12 }, (_, i) => (
              <View key={i} style={cell}>
                <WedgieRowPlaceholder />
              </View>
            ))}
          </View>
        </ScrollView>
      </TopSafeArea>
    );
  }

  return (
    <TopSafeArea style={styles.safe}>
      <FlatList
        ref={shotRef}
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: tabBar }]}
        data={wedgies}
        keyExtractor={(w) => String(w.id)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // Two columns on a wide screen, like the iPhone Duo opened up.
        key={wide ? "wide" : "narrow"}
        numColumns={wide ? 2 : 1}
        columnWrapperStyle={wide ? styles.columns : undefined}
        ItemSeparatorComponent={Separator}
        getItemLayout={
          wide
            ? undefined
            : (_, index) => ({
                length: WEDGIE_ROW_HEIGHT + GAP,
                offset: (WEDGIE_ROW_HEIGHT + GAP) * index,
                index,
              })
        }
        refreshControl={
          <RefreshControl
            refreshing={all.isRefetching || bySeason.isRefetching}
            onRefresh={() => {
              void all.refetch();
              if (filters.season) void bySeason.refetch();
            }}
            tintColor={colors.cream}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <WedgieFilters
              filters={filters}
              onChange={onChange}
              visible={wedgies.length}
              all={all.data ?? null}
            />

            {shouldShowPreviousSeason &&
            filters.season === previousSeason?.name ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Current season has no wedgies yet. Showing{" "}
                  {previousSeason?.name} season wedgies.
                </Text>
              </View>
            ) : null}

            {/* A failed load is not an empty result, so never show both. */}
            {error ? (
              <ErrorState
                onRetry={() =>
                  void (filters.season ? bySeason.refetch() : all.refetch())
                }
              />
            ) : wedgies.length === 0 ? (
              <Empty label="No wedgies match those filters." />
            ) : null}
          </View>
        }
        ListFooterComponent={wedgies.length ? <SupportFooter /> : undefined}
        renderItem={({ item }) => (
          <View style={cell}>
            <WedgieRow
              wedgie={item}
              onPress={() => router.push(`/wedgie/${item.id}`)}
            />
          </View>
        )}
      />
    </TopSafeArea>
  );
}

function Separator() {
  return <View style={{ height: GAP }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.night },
  screen: { flex: 1, backgroundColor: colors.night },
  content: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: { marginBottom: 32 },
  list: { marginTop: 32, gap: GAP },
  listWide: { flexDirection: "row", flexWrap: "wrap" },
  columns: { gap: GAP },
  notice: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(154, 92, 245, 0.3)",
    backgroundColor: "rgba(154, 92, 245, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    fontFamily: fonts.bold,
    color: colors.violet,
    fontSize: 13,
    textAlign: "center",
  },
});
