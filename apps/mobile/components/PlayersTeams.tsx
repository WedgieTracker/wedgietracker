import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Loader } from "@/components/Loader";
import {
  StandingsList,
  type StandingsItem,
  type Sticky,
} from "@/components/StandingsList";
import { colors, fonts } from "@/lib/theme";

type Tab = "players" | "teams";

/**
 * Port of apps/web/src/components/standings/PlayersTeams.tsx as it shows on a
 * phone: players and teams behind a switch, each name opening All wedgies
 * filtered to it.
 */
export function PlayersTeams({
  players,
  teams,
  onPressItem,
  limit,
  showCount,
  loading = false,
  sideBySide = false,
  sticky,
}: {
  /** While the lists load: the switch and an empty card with the loader. */
  loading?: boolean;
  players: StandingsItem[];
  teams: StandingsItem[];
  onPressItem?: (name: string, kind: Tab) => void;
  limit?: number;
  showCount?: boolean;
  /** Both lists at once, with no switch, on a wide screen. */
  sideBySide?: boolean;
  sticky?: Sticky;
}) {
  const [tab, setTab] = useState<Tab>("players");

  if (sideBySide) {
    return (
      <View style={styles.side}>
        {(["players", "teams"] as const).map((kind) =>
          loading ? (
            <View key={kind} style={[styles.loading, styles.flex]}>
              <Loader size={96} />
            </View>
          ) : (
            <StandingsList
              key={kind}
              style={styles.flex}
              title={kind === "players" ? "Players" : "Teams"}
              kind={kind}
              items={kind === "players" ? players : teams}
              onPressItem={
                onPressItem ? (name) => onPressItem(name, kind) : undefined
              }
              limit={limit}
              showCount={showCount}
              sticky={sticky}
            />
          ),
        )}
      </View>
    );
  }

  return (
    <View>
      <Switch value={tab} onChange={setTab} />
      {loading ? (
        <View style={styles.loading}>
          <Loader size={96} />
        </View>
      ) : (
        <StandingsList
          // A fresh list per tab, so "Show all" does not carry across.
          key={tab}
          title={tab === "players" ? "Players" : "Teams"}
          kind={tab}
          items={tab === "players" ? players : teams}
          onPressItem={
            onPressItem ? (name) => onPressItem(name, tab) : undefined
          }
          limit={limit}
          showCount={showCount}
          sticky={sticky}
        />
      )}
    </View>
  );
}

function Switch({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (next: Tab) => void;
}) {
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {(["players", "teams"] as const).map((t) => {
        const on = value === t;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.option, on && styles.optionOn]}
          >
            <Text
              style={[styles.optionText, on && styles.optionTextOn]}
              allowFontScaling={false}
            >
              {t === "players" ? "Players" : "Teams"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  side: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  flex: { flex: 1 },
  // `mb-2.5 flex rounded-full bg-black/25 p-1`
  switch: {
    flexDirection: "row",
    marginBottom: 10,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  optionOn: { backgroundColor: colors.cream },
  optionText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.cream70,
  },
  optionTextOn: { color: colors.night },
  loading: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.violet20,
    backgroundColor: colors.panel,
  },
});
