import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCountUp } from "@/components/Counter";
import { Empty, ErrorState, Loading } from "@/components/States";
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

  const [season, setSeason] = useState(defaultSeason);
  const [type, setType] = useState("");
  const [playerOrTeam, setPlayerOrTeam] = useState("");

  useEffect(() => {
    if (shouldShowPreviousSeason && previousSeason) {
      setSeason(previousSeason.name);
    } else if (global?.currentSeason?.name) {
      setSeason(global.currentSeason.name);
    }
  }, [shouldShowPreviousSeason, previousSeason, global?.currentSeason?.name]);

  // The web app queries by season when one is picked, and everything otherwise.
  const all = api.wedgie.getAll.useQuery();
  const bySeason = api.wedgie.getBySeason.useQuery(
    { season },
    { enabled: !!season },
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

  return (
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

            <ChipRow
              options={["All Seasons", ...seasons]}
              selected={season || "All Seasons"}
              onSelect={(value) =>
                setSeason(value === "All Seasons" ? "" : value)
              }
            />

            <ChipRow
              options={["All Types", ...types]}
              selected={type || "All Types"}
              onSelect={(value) => setType(value === "All Types" ? "" : value)}
              tone="pink"
            />

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

          {isPending || isLoadingSeasonData ? (
            <Loading label="Loading wedgies" />
          ) : null}
          {error ? <ErrorState message={error.message} /> : null}
          {!isPending && wedgies.length === 0 ? (
            <Empty label="No wedgies match those filters." />
          ) : null}
        </View>
      }
      renderItem={({ item, index }) => (
        <WedgieRow
          wedgie={item}
          first={index === 0}
          last={index === wedgies.length - 1}
          onPress={() => router.push(`/wedgie/${item.id}`)}
        />
      )}
    />
  );
}

/** Horizontal chip picker, the mobile stand-in for the web's <select>. */
function ChipRow({
  options,
  selected,
  onSelect,
  tone = "yellow",
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  tone?: "yellow" | "pink";
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.chip,
              tone === "pink" && styles.chipPink,
              active && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                tone === "pink" && styles.chipTextPink,
                active && styles.chipTextActive,
              ]}
              numberOfLines={1}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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

  chipRow: { gap: space.sm, paddingRight: space.md },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: "rgba(234, 255, 0, 0.12)",
  },
  chipPink: { backgroundColor: "rgba(255, 0, 255, 0.14)" },
  chipActive: { backgroundColor: colors.yellow },
  chipText: { fontFamily: fonts.black, color: colors.yellow, fontSize: 13 },
  chipTextPink: { color: colors.pink },
  chipTextActive: { color: colors.darkpurple },

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
