import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  CountRow,
  FilterPill,
  FilterSheet,
  GroupLabel,
} from "@/components/FilterSheet";
import { ChipNumber, PageHeading } from "@/components/PageHeading";
import type { RouterOutputs } from "@/lib/api";
import { track } from "@/lib/observability";
import { colors, fonts } from "@/lib/theme";
import {
  MOMENT_FILTERS,
  matchesFilter,
} from "@wedgietracker/core/utils/wedgieFilter";

export interface Filters {
  season: string;
  type: string;
  moment: string;
  playerOrTeam: string;
}

export const NO_FILTERS: Filters = {
  season: "",
  type: "",
  moment: "",
  playerOrTeam: "",
};

type Kind = "season" | "type" | "moment";
type AllWedgies = RouterOutputs["wedgie"]["getAll"];

const LABELS: Record<Kind, { label: string; any: string }> = {
  season: { label: "Season", any: "All time" },
  type: { label: "Type", any: "Any type" },
  moment: { label: "When", any: "Anytime" },
};

const KINDS = Object.keys(LABELS) as Kind[];

/**
 * Port of apps/web/src/components/all-wedgies/WedgieFilters.tsx: the heading
 * with a live count, a player or team search, then Season, Type and When
 * pills. Each pill opens a sheet listing its choices with how many wedgies
 * each would show given the other filters, as a count and a bar. A pill
 * turns cream once it's set, and "Clear filters" under the count resets
 * everything.
 *
 * Without `all` it is the skeleton: the same heading, search and pills,
 * empty and still.
 */
export function WedgieFilters({
  filters,
  onChange,
  visible,
  all,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  visible: number | null;
  all: AllWedgies | null;
}) {
  const [open, setOpen] = useState<Kind | null>(null);
  const skeleton = all === null;
  const anySet =
    !skeleton &&
    Boolean(
      filters.season || filters.type || filters.moment || filters.playerOrTeam,
    );

  const set = (kind: Kind, value: string) => {
    track("wt_filter_applied", { filter: kind, value });
    onChange({ ...filters, [kind]: value });
    setOpen(null);
  };

  // As wide as the biggest number the chip can show, so it never resizes.
  const widest = "0".repeat(String(all?.length ?? 0).length || 3);

  return (
    <View>
      <PageHeading
        title="All wedgies"
        badge={
          <ChipNumber
            value={visible === null ? "" : String(visible)}
            widest={skeleton ? "000" : widest}
          />
        }
        badgeAction={
          anySet ? (
            <View style={styles.clearWrap} pointerEvents="box-none">
              <Pressable
                onPress={() => {
                  track("wt_filter_applied", { filter: "clear", value: "" });
                  onChange(NO_FILTERS);
                  setOpen(null);
                }}
                hitSlop={10}
                accessibilityRole="button"
                style={styles.clear}
              >
                {({ pressed }) => (
                  <>
                    <Svg width={8} height={8} viewBox="0 0 12 12">
                      <Path
                        d="M2 2l8 8M10 2l-8 8"
                        stroke={pressed ? colors.cream : colors.cream70}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                      />
                    </Svg>
                    <Text
                      style={[styles.clearText, pressed && styles.clearPressed]}
                      allowFontScaling={false}
                    >
                      Clear filters
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null
        }
      />

      <View style={[styles.controls, skeleton && styles.dim]}>
        <View style={styles.search}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle
              cx={11}
              cy={11}
              r={7}
              stroke={colors.cream}
              strokeOpacity={0.45}
              strokeWidth={2.5}
            />
            <Path
              d="M20 20l-4-4"
              stroke={colors.cream}
              strokeOpacity={0.45}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            value={filters.playerOrTeam}
            onChangeText={(playerOrTeam) =>
              onChange({ ...filters, playerOrTeam })
            }
            editable={!skeleton}
            placeholder="Player or team"
            placeholderTextColor="rgba(240, 225, 182, 0.45)"
            accessibilityLabel="Player or team"
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.pills}>
          {KINDS.map((kind) => {
            const value = skeleton ? "" : filters[kind];
            return (
              <FilterPill
                key={kind}
                label={value || LABELS[kind].label}
                set={Boolean(value)}
                open={open === kind}
                disabled={skeleton}
                onPress={() => setOpen(kind)}
                accessibilityLabel={`${LABELS[kind].label}: ${value || LABELS[kind].any}`}
                // The Season pill is sized for a season like 2026/27, so it
                // doesn't grow when the default season fills in.
                sizeFor={kind === "season" ? "0000/00" : undefined}
              />
            );
          })}
        </View>
      </View>

      {all ? (
        <FilterSheet
          title={open ? LABELS[open].label : ""}
          visible={open !== null}
          onClose={() => setOpen(null)}
        >
          {open ? (
            <Choices
              kind={open}
              all={all}
              filters={filters}
              onPick={(value) => set(open, value)}
            />
          ) : null}
        </FilterSheet>
      ) : null}
    </View>
  );
}

/**
 * The rows for one pill. Counts are taken against the other filters as they
 * stand, so a choice shows how many wedgies picking it would leave.
 */
function Choices({
  kind,
  all,
  filters,
  onPick,
}: {
  kind: Kind;
  all: AllWedgies;
  filters: Filters;
  onPick: (value: string) => void;
}) {
  const countFor = (value: string) =>
    all.filter(
      (w) =>
        (kind === "season"
          ? !value || w.seasonName === value
          : !filters.season || w.seasonName === filters.season) &&
        matchesFilter(w, { ...filters, [kind]: value }),
    ).length;

  let values: string[];
  if (kind === "season") {
    const named = Array.from(
      new Set(all.flatMap((w) => (w.seasonName ? [w.seasonName] : []))),
    );
    // Newest season first, GEMS on their own at the end.
    values = [
      ...named
        .filter((s) => s !== "GEMS")
        .sort()
        .reverse(),
      ...(named.includes("GEMS") ? ["GEMS"] : []),
    ];
  } else if (kind === "type") {
    values = Array.from(
      new Set(
        all.flatMap((w) =>
          (w.types ?? []).flatMap((t) => (t.name ? [t.name] : [])),
        ),
      ),
    ).sort();
  } else {
    values = [...MOMENT_FILTERS];
  }

  const list = values.map((value) => ({ value, count: countFor(value) }));
  // Most common types first.
  if (kind === "type") list.sort((a, b) => b.count - a.count);
  const regular = list.filter((c) => c.value !== "GEMS");
  const gems = list.find((c) => c.value === "GEMS");
  const max = Math.max(0, ...list.map((c) => c.count));
  const any = countFor("");

  const row = (value: string, label: string, count: number, top: number) => (
    <CountRow
      key={label}
      value={value}
      label={label}
      count={count}
      max={top}
      on={filters[kind] === value}
      onPick={() => onPick(value)}
    />
  );

  return (
    <>
      {row("", LABELS[kind].any, any, any)}
      {kind === "season" ? <GroupLabel>Seasons</GroupLabel> : null}
      {regular.map((c) => row(c.value, c.value, c.count, max))}
      {gems ? (
        <>
          <GroupLabel>Outside the seasons</GroupLabel>
          {row(gems.value, gems.value, gems.count, max)}
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  // Under the chip, out of the flow: `absolute top-full left-1/2 mt-2`.
  clearWrap: {
    position: "absolute",
    top: "100%",
    left: -60,
    right: -60,
    marginTop: 8,
    alignItems: "center",
  },
  clear: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    color: colors.cream70,
  },
  clearPressed: { color: colors.cream },

  controls: { marginTop: 32 },
  dim: { opacity: 0.4 },

  // `border-violet/40 bg-night min-h-[50px] rounded-2xl border-2 px-3.5`
  search: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(154, 92, 245, 0.4)",
    backgroundColor: colors.night,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.cream,
  },

  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
});
