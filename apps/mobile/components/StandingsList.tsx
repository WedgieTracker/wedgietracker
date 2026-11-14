import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { track } from "@/lib/observability";
import { colors, fonts } from "@/lib/theme";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";

const TEAM_NAMES = new Map(TEAMS.map((t) => [t.code, t.fullName]));

export interface StandingsItem {
  name: string;
  count: number;
}

const ROW_HEIGHT = 50;

/**
 * Consecutive items with the same count, numbered 1, 2, 3 by count (a tie
 * shares a number and the next count takes the next one).
 */
function groupByCount(items: StandingsItem[]) {
  const groups: { rank: number; items: StandingsItem[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.items[0]?.count === item.count) last.items.push(item);
    else groups.push({ rank: groups.length + 1, items: [item] });
  }
  return groups;
}

/**
 * Port of apps/web/src/components/standings/StandingsList.tsx: a ranked list
 * where a tie is one rounded bracket, the shared rank at its top. Teams are
 * stored as codes and shown by their full names; anything that is not a real
 * team shows as stored.
 */
export function StandingsList({
  title,
  items,
  kind = "players",
  onPressItem,
  limit,
  showCount = true,
  style,
}: {
  title?: string;
  items: StandingsItem[];
  kind?: "players" | "teams";
  onPressItem?: (name: string) => void;
  /** Show this many, then a button for the rest. */
  limit?: number;
  showCount?: boolean;
  style?: ViewStyle;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = limit && !showAll ? items.slice(0, limit) : items;
  const label = (name: string) =>
    kind === "teams" ? (TEAM_NAMES.get(name) ?? name) : name;

  const row = (item: StandingsItem) => (
    <Pressable
      onPress={
        onPressItem
          ? () => {
              track("wt_standings_tapped", { list: kind });
              onPressItem(item.name);
            }
          : undefined
      }
      accessibilityRole={onPressItem ? "link" : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.name} numberOfLines={1} allowFontScaling={false}>
        {label(item.name)}
      </Text>
      <Text style={styles.count} allowFontScaling={false}>
        {item.count}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.title} allowFontScaling={false}>
            {title}
          </Text>
          {showCount ? (
            <Text style={styles.titleCount} allowFontScaling={false}>
              {items.length}
            </Text>
          ) : null}
        </View>
      ) : null}

      {items.length === 0 ? (
        <Text style={styles.empty}>No wedgies this season yet.</Text>
      ) : (
        groupByCount(shown).map(({ rank, items: group }, index) =>
          group.length === 1 ? (
            <View
              key={group[0]!.name}
              style={[styles.single, index > 0 && styles.divider]}
            >
              <Text style={styles.rank} allowFontScaling={false}>
                {rank}
              </Text>
              <View style={styles.flex}>{row(group[0]!)}</View>
            </View>
          ) : (
            <View
              key={`rank-${rank}`}
              accessibilityLabel={`Tied ${rank}`}
              style={[styles.tie, index > 0 && styles.divider]}
            >
              <Text
                style={[styles.rank, styles.tieRank]}
                allowFontScaling={false}
              >
                {rank}
              </Text>
              <View style={styles.bracket} />
              <View style={styles.flex}>
                {group.map((item, i) => (
                  <View
                    key={item.name}
                    style={[styles.tieRow, i > 0 && styles.divider]}
                  >
                    {row(item)}
                  </View>
                ))}
              </View>
            </View>
          ),
        )
      )}

      {limit && items.length > limit ? (
        <Pressable
          onPress={() => setShowAll((s) => !s)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
        >
          <Text style={styles.moreText} allowFontScaling={false}>
            {showAll
              ? `Show top ${limit}`
              : `Show all ${items.length} ${kind === "teams" ? "teams" : "players"}`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // `bg-panel border-violet/20 rounded-[20px] border px-4 py-1`
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.violet20,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 6,
  },
  title: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.cream },
  titleCount: { fontFamily: fonts.bold, fontSize: 13, color: colors.cream50 },
  empty: {
    paddingVertical: 24,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.cream70,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(154, 92, 245, 0.15)",
  },
  flex: { flex: 1 },

  // `grid-cols-[58px_1fr]`, the rank right-aligned in the first 24pt.
  single: { flexDirection: "row", alignItems: "center" },
  rank: {
    width: 58,
    paddingRight: 34,
    paddingTop: 3,
    textAlign: "right",
    fontFamily: fonts.blackItalic,
    fontSize: 18,
    color: colors.violet,
  },
  // `grid-cols-[38px_10px_1fr]`: rank, bracket, rows.
  tie: { flexDirection: "row" },
  tieRank: {
    width: 38,
    paddingRight: 14,
    lineHeight: ROW_HEIGHT,
    paddingTop: 3,
  },
  bracket: {
    width: 10,
    marginVertical: ROW_HEIGHT / 2,
    borderWidth: 2,
    borderRightWidth: 0,
    borderColor: colors.violet60,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  tieRow: { paddingLeft: 10 },

  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowPressed: { opacity: 0.7 },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.cream,
  },
  count: {
    fontFamily: fonts.black,
    fontSize: 15,
    color: colors.cream,
    fontVariant: ["tabular-nums"],
  },

  // `border-violet/45 bg-violet/10 my-3.5 min-h-[52px] rounded-2xl border-[1.5px]`
  more: {
    marginVertical: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(154, 92, 245, 0.45)",
    backgroundColor: "rgba(154, 92, 245, 0.1)",
  },
  morePressed: { backgroundColor: "rgba(154, 92, 245, 0.25)" },
  moreText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.cream },
});
