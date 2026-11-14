import { keepPreviousData } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CountRow,
  FilterPill,
  FilterSheet,
  GroupLabel,
} from "@/components/FilterSheet";
import { GradientFill } from "@/components/Gradient";
import { PageHeading } from "@/components/PageHeading";
import { PlayersTeams } from "@/components/PlayersTeams";
import { Screen } from "@/components/Screen";
import { ErrorState } from "@/components/States";
import { api } from "@/lib/api";
import { track } from "@/lib/observability";
import { useSeasonFallback } from "@/lib/use-season-fallback";
import { useWide } from "@/lib/wide";
import { colors, fonts } from "@/lib/theme";
import { seasonFromParam } from "@wedgietracker/core/utils/allWedgiesUrl";

/**
 * Port of apps/web/src/components/standings/StandingsPage.tsx: a Season pill
 * that opens the seasons with their counts, the Including opponents switch
 * with a line saying what it does, then players and teams, top 20 first.
 * Opens on `?season=` (2025-26, or "all") when a link brings one.
 */
export default function StandingsScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { wide } = useWide();
  const scrollY = useSharedValue(0);
  const params = useLocalSearchParams<{ season?: string }>();
  const {
    global,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: isLoadingSeasonData,
  } = useSeasonFallback();

  const initialSeason =
    (shouldShowPreviousSeason ? previousSeason?.name : undefined) ??
    global?.currentSeason?.name;

  const fromParam = (p: string | undefined) =>
    p === undefined ? undefined : p === "all" ? "" : seasonFromParam(p);
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(
    fromParam(params.season),
  );
  // A link from Seasons history names a season; follow it each time.
  useEffect(() => {
    const next = fromParam(params.season);
    if (next !== undefined) setSelectedSeason(next);
  }, [params.season]);

  const [includeOpponents, setIncludeOpponents] = useState(true);
  const [open, setOpen] = useState(false);

  // Until a season is picked by hand, follow the one the page opens on.
  const season = selectedSeason ?? initialSeason;

  const standings = api.wedgie.getSeasonStandings.useQuery(
    { season: season ?? "", includeOpponents },
    // Changing a filter makes a new query key; without this the list blanks
    // and everything below it jumps while the next one loads.
    { enabled: season !== undefined, placeholderData: keepPreviousData },
  );
  const all = api.wedgie.getAll.useQuery();

  const counts = new Map<string, number>();
  for (const w of all.data ?? []) {
    if (w.seasonName)
      counts.set(w.seasonName, (counts.get(w.seasonName) ?? 0) + 1);
  }
  // Newest season first, GEMS on their own at the end.
  const seasons = [...counts.keys()]
    .filter((s) => s !== "GEMS")
    .sort()
    .reverse();
  const max = Math.max(0, ...counts.values());

  const pick = (value: string) => {
    track("wt_filter_applied", { filter: "season", value });
    setSelectedSeason(value);
    setOpen(false);
  };
  const row = (value: string, label: string, count: number) => (
    <CountRow
      key={label}
      value={value}
      label={label}
      count={count}
      max={max}
      on={season === value}
      onPick={() => pick(value)}
    />
  );

  const loading = isLoadingSeasonData || standings.isPending;

  return (
    <Screen
      heading={<PageHeading title="Wedgie leaderboard" />}
      scrollY={scrollY}
      refreshControl={
        <RefreshControl
          refreshing={standings.isRefetching}
          onRefresh={() => void standings.refetch()}
          tintColor={colors.cream}
        />
      }
    >
      <View style={[styles.filters, isLoadingSeasonData && styles.dim]}>
        <View style={styles.pills}>
          <FilterPill
            label={(isLoadingSeasonData ? "" : season) || "All time"}
            set={!isLoadingSeasonData && !!season}
            open={open}
            disabled={isLoadingSeasonData || !all.data}
            onPress={() => setOpen(true)}
            accessibilityLabel={`Season: ${season || "All time"}`}
            sizeFor="0000/00"
          />
          <FilterPill
            label="Including opponents"
            set={false}
            open={false}
            onPress={() => {
              track("wt_filter_applied", {
                filter: "includeOpponents",
                value: String(!includeOpponents),
              });
              setIncludeOpponents(!includeOpponents);
            }}
            accessibilityLabel="Including opponents"
          >
            <Toggle value={includeOpponents} />
          </FilterPill>
        </View>
        <Text style={styles.note} allowFontScaling={false}>
          {includeOpponents
            ? "Teams also count the other side's wedgies in their games."
            : "Teams only count their own players' wedgies."}
        </Text>
      </View>

      {all.data ? (
        <FilterSheet
          title="Season"
          visible={open}
          onClose={() => setOpen(false)}
        >
          {row("", "All time", all.data.length)}
          <GroupLabel>Seasons</GroupLabel>
          {seasons.map((s) => row(s, s, counts.get(s) ?? 0))}
          {counts.has("GEMS") ? (
            <>
              <GroupLabel>Outside the seasons</GroupLabel>
              {row("GEMS", "GEMS", counts.get("GEMS") ?? 0)}
            </>
          ) : null}
        </FilterSheet>
      ) : null}

      {shouldShowPreviousSeason && season === previousSeason?.name ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Current season has no wedgies yet. Showing {previousSeason?.name}{" "}
            season standings.
          </Text>
        </View>
      ) : null}

      {standings.error ? (
        <ErrorState onRetry={() => void standings.refetch()} />
      ) : (
        <View style={[standings.isPlaceholderData && styles.stale]}>
          <PlayersTeams
            loading={loading}
            players={standings.data?.players ?? []}
            teams={standings.data?.teams ?? []}
            limit={20}
            sideBySide={wide}
            sticky={{ scrollY, top: top + 8 }}
            onPressItem={(name, kind) =>
              router.push({
                pathname: "/all-wedgies",
                params: {
                  ...(kind === "teams" ? { wt: name } : { wp: name }),
                  ws: season || "all",
                },
              })
            }
          />
        </View>
      )}
    </Screen>
  );
}

/** The pill's small switch: cream knob on the button gradient when on. */
function Toggle({ value }: { value: boolean }) {
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? 14 : 0, { duration: 150 }) }],
  }));

  return (
    <View
      style={[styles.toggle, !value && styles.toggleOff]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      {value ? <GradientFill name="button" radius={11} /> : null}
      <Animated.View style={[styles.knob, !value && styles.knobOff, knob]} />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { marginTop: 32, marginBottom: 16 },
  dim: { opacity: 0.4 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  note: {
    marginTop: 8,
    paddingLeft: 2,
    fontFamily: fonts.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.cream50,
  },
  // `h-[22px] w-9 rounded-full`, the knob `size-4` at 3pt.
  toggle: { width: 36, height: 22, borderRadius: 11, marginLeft: 4 },
  toggleOff: { backgroundColor: colors.cream20 },
  knob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.cream,
  },
  knobOff: { backgroundColor: colors.cream70 },

  notice: {
    marginBottom: 16,
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
  stale: { opacity: 0.6 },
});
