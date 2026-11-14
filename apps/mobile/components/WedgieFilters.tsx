import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { ChipNumber, PageHeading } from "@/components/PageHeading";
import { track } from "@/lib/observability";
import { colors, fonts } from "@/lib/theme";

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

const LABELS: Record<Kind, { label: string; any: string }> = {
  season: { label: "Season", any: "All time" },
  type: { label: "Type", any: "Any" },
  moment: { label: "When", any: "Anytime" },
};

const KINDS = Object.keys(LABELS) as Kind[];

/**
 * Port of apps/web/src/components/all-wedgies/WedgieFilters.tsx: the heading
 * with a live count, a player or team search, then Season, Type and When
 * pills that each open their choices. A pill turns cream once it's set, and
 * the cream x on the count clears everything.
 *
 * Without `choices` it is the skeleton: the same heading, search and pills,
 * empty and still.
 */
export function WedgieFilters({
  filters,
  onChange,
  visible,
  total,
  choices,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  visible: number | null;
  total: number | null;
  choices: Record<Kind, string[]> | null;
}) {
  const [open, setOpen] = useState<Kind | null>(null);
  const skeleton = choices === null;
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
  const widest = "0".repeat(String(total ?? 0).length || 3);

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
            <Pressable
              onPress={() => {
                track("wt_filter_applied", { filter: "clear", value: "" });
                onChange(NO_FILTERS);
                setOpen(null);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear filters"
              style={({ pressed }) => [
                styles.clear,
                pressed && styles.clearPressed,
              ]}
            >
              {({ pressed }) => (
                <Svg width={10} height={10} viewBox="0 0 12 12">
                  <Path
                    d="M2 2l8 8M10 2l-8 8"
                    stroke={pressed ? colors.cream : colors.night}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                  />
                </Svg>
              )}
            </Pressable>
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
            const value = filters[kind];
            const on = Boolean(value) && !skeleton;
            return (
              <Pressable
                key={kind}
                disabled={skeleton}
                onPress={() => setOpen(open === kind ? null : kind)}
                accessibilityRole="button"
                accessibilityLabel={`${LABELS[kind].label}: ${value || LABELS[kind].any}`}
                accessibilityState={{ expanded: open === kind }}
                style={[styles.pill, on && styles.pillOn]}
              >
                <PillLabel kind={kind} on={on}>
                  {(!skeleton && value) || LABELS[kind].label}
                </PillLabel>
                <Text
                  style={[styles.caret, on && styles.pillTextOn]}
                  allowFontScaling={false}
                >
                  ▾
                </Text>
              </Pressable>
            );
          })}
        </View>

        {open && choices ? (
          <View style={styles.popover} accessibilityLabel={LABELS[open].label}>
            {["", ...choices[open]].map((value) => {
              const on = filters[open] === value;
              return (
                <Pressable
                  key={value || "__any__"}
                  onPress={() => set(open, value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.choice, on && styles.choiceOn]}
                >
                  <Text
                    style={[styles.choiceText, on && styles.choiceTextOn]}
                    allowFontScaling={false}
                  >
                    {value || LABELS[open].any}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * A pill's label. The Season pill is sized for its widest value (a season
 * like 2026/27), so it doesn't grow, and push Type and When along, when the
 * default season fills in.
 */
function PillLabel({
  kind,
  on,
  children,
}: {
  kind: Kind;
  on: boolean;
  children: string;
}) {
  const text = (
    <Text
      style={[styles.pillText, on && styles.pillTextOn]}
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
  if (kind !== "season") return text;
  return (
    <View>
      <Text
        style={[styles.pillText, styles.invisible]}
        allowFontScaling={false}
      >
        0000/00
      </Text>
      <View style={styles.overlay}>{text}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  // On the chip's corner: `absolute -top-2.5 -right-2.5 size-6`.
  clear: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    shadowColor: "#050214",
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  clearPressed: { backgroundColor: colors.violet },

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
  // `min-h-10 rounded-xl border px-3 text-[13.5px] font-extrabold`
  pill: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(154, 92, 245, 0.3)",
    backgroundColor: colors.panel,
  },
  pillOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  pillText: {
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: colors.cream,
  },
  pillTextOn: { color: colors.night },
  caret: { fontSize: 11, color: colors.cream, opacity: 0.6 },
  invisible: { opacity: 0 },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },

  // `bg-panel border-violet/35 rounded-2xl border p-3 gap-1.5`
  popover: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(154, 92, 245, 0.35)",
    backgroundColor: colors.panel,
    shadowColor: "#050214",
    shadowOpacity: 0.6,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 14 },
  },
  choice: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(154, 92, 245, 0.25)",
    backgroundColor: colors.panel,
  },
  choiceOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  choiceText: {
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: "rgba(240, 225, 182, 0.75)",
  },
  choiceTextOn: { color: colors.night },
});
