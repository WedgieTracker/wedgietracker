import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { GradientFill } from "@/components/Gradient";
import { PageHeading } from "@/components/PageHeading";
import { PlayersTeams } from "@/components/PlayersTeams";
import { Screen } from "@/components/Screen";
import { ErrorState } from "@/components/States";
import { api } from "@/lib/api";
import { track } from "@/lib/observability";
import { useSeasonFallback } from "@/lib/use-season-fallback";
import { colors, fonts } from "@/lib/theme";

/**
 * Port of apps/web/src/components/standings/StandingsPage.tsx: season chips,
 * the Including opponents switch, then players and teams, top 20 first.
 */
export default function StandingsScreen() {
  const router = useRouter();
  const {
    global,
    seasons,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: isLoadingSeasonData,
  } = useSeasonFallback();

  const initialSeason =
    (shouldShowPreviousSeason ? previousSeason?.name : undefined) ??
    global?.currentSeason?.name;

  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(
    undefined,
  );
  const [includeOpponents, setIncludeOpponents] = useState(true);

  // Until a season is picked by hand, follow the one the page opens on.
  const season = selectedSeason ?? initialSeason;

  const standings = api.wedgie.getSeasonStandings.useQuery(
    { season: season ?? "", includeOpponents },
    // Changing a filter makes a new query key; without this the list blanks
    // and everything below it jumps while the next one loads.
    { enabled: season !== undefined, placeholderData: keepPreviousData },
  );

  const named = (seasons ?? []).map((s) => s.name);
  // Newest season first, GEMS last.
  const chips: [string, string][] = [
    ["", "All time"],
    ...named
      .filter((s) => s !== "GEMS")
      .sort()
      .reverse()
      .map((s): [string, string] => [s, s]),
    ...(named.includes("GEMS") ? [["GEMS", "GEMS"] as [string, string]] : []),
  ];

  const loading = isLoadingSeasonData || standings.isPending;

  return (
    <Screen
      heading={<PageHeading title="Standings" />}
      refreshControl={
        <RefreshControl
          refreshing={standings.isRefetching}
          onRefresh={() => void standings.refetch()}
          tintColor={colors.cream}
        />
      }
    >
      <View style={styles.filters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}
          accessibilityLabel="Season"
        >
          {chips.map(([value, label]) => {
            const on = !isLoadingSeasonData && season === value;
            return (
              <Pressable
                key={label}
                onPress={() => {
                  track("wt_filter_applied", { filter: "season", value });
                  setSelectedSeason(value);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text
                  style={[styles.chipText, on && styles.chipTextOn]}
                  allowFontScaling={false}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.opponents}>
          <View style={styles.opponentsText}>
            <Text style={styles.opponentsTitle} allowFontScaling={false}>
              Including opponents
            </Text>
            <Text style={styles.opponentsNote} allowFontScaling={false}>
              Teams also count the other side&apos;s wedgies in their games
            </Text>
          </View>
          <Toggle
            value={includeOpponents}
            onChange={(next) => {
              track("wt_filter_applied", {
                filter: "includeOpponents",
                value: String(next),
              });
              setIncludeOpponents(next);
            }}
          />
        </View>
      </View>

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

/** The switch: cream knob on the button gradient when on, faded when off. */
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? 20 : 0, { duration: 150 }) }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel="Including opponents"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[styles.toggle, !value && styles.toggleOff]}
    >
      {value ? <GradientFill name="button" radius={15} /> : null}
      <Animated.View style={[styles.knob, !value && styles.knobOff, knob]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: { marginTop: 32, marginBottom: 16 },
  // Bleeds to the screen edges so the chips scroll out from under them.
  chipScroll: { marginHorizontal: -16 },
  chips: { gap: 8, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 6 },
  // `bg-panel border-violet/20 min-h-10 rounded-full border px-[15px]`
  chip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.violet20,
    backgroundColor: colors.panel,
  },
  chipOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  chipText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.cream70,
  },
  chipTextOn: { color: colors.night },

  opponents: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.violet20,
    backgroundColor: colors.panel,
  },
  opponentsText: { flex: 1 },
  opponentsTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 14.5,
    color: colors.cream,
  },
  opponentsNote: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.cream50,
  },
  toggle: { width: 50, height: 30, borderRadius: 15 },
  toggleOff: { backgroundColor: colors.cream20 },
  knob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
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
