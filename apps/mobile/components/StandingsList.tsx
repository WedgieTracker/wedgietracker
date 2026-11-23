import { useRef, useState, type ComponentRef, type RefObject } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

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
  sticky,
}: {
  title?: string;
  items: StandingsItem[];
  kind?: "players" | "teams";
  onPressItem?: (name: string) => void;
  /** Show this many, then a button for the rest. */
  limit?: number;
  showCount?: boolean;
  style?: ViewStyle;
  /**
   * The screen's scroll position and how far from the top of the window a
   * tied rank should stop, so it stays in view while a long tie scrolls by.
   */
  sticky?: Sticky;
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
            <TieGroup
              key={`rank-${rank}`}
              rank={rank}
              divider={index > 0}
              sticky={sticky}
            >
              {group.map((item, i) => (
                <View
                  key={item.name}
                  style={[styles.tieRow, i > 0 && styles.divider]}
                >
                  {row(item)}
                </View>
              ))}
            </TieGroup>
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

export interface Sticky {
  /** The scroll view's offset, updated on every scroll frame. */
  scrollY: SharedValue<number>;
  /** The view that holds the scrolling content, to measure groups against. */
  content: RefObject<ComponentRef<typeof View> | null>;
  /** Where the content view starts inside the scroll view. */
  contentTop: number;
  /** How far below the scroll view's top edge a pinned rank stops. */
  top: number;
}

// The rank's line plus its 3pt nudge down.
const RANK_HEIGHT = ROW_HEIGHT + 3;

/**
 * A tie: the shared rank, a rounded bracket spanning the tied rows, then the
 * rows. With `sticky`, the rank follows the top of the screen down the group
 * while the group scrolls past, as the site's `position: sticky` does. React
 * Native has no sticky inside a list item, so the group's place in the
 * content is measured on layout and the rank moved within it as the screen
 * scrolls.
 */
function TieGroup({
  rank,
  divider,
  sticky,
  children,
}: {
  rank: number;
  divider: boolean;
  sticky?: Sticky;
  children: React.ReactNode;
}) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const groupY = useSharedValue(Number.NaN);
  const groupH = useSharedValue(0);
  const scrollY = sticky?.scrollY;
  const top = (sticky?.top ?? 0) - (sticky?.contentTop ?? 0);

  const place = () => {
    const content = sticky?.content.current;
    if (!content || !ref.current) return;
    ref.current.measureLayout(content, (_x, y, _w, h) => {
      groupY.value = y;
      groupH.value = h;
    });
  };

  const follow = useAnimatedStyle(() => {
    if (!scrollY || Number.isNaN(groupY.value)) return {};
    // Where the group's top is now, from the top of the scroll view.
    const onScreen = groupY.value - scrollY.value;
    const room = Math.max(groupH.value - RANK_HEIGHT, 0);
    const shift = Math.min(Math.max(top - onScreen, 0), room);
    return { transform: [{ translateY: shift }] };
  });

  return (
    <View
      ref={ref}
      onLayout={sticky ? place : undefined}
      accessibilityLabel={`Tied ${rank}`}
      style={[styles.tie, divider && styles.divider]}
    >
      <Animated.Text
        style={[styles.rank, styles.tieRank, follow]}
        allowFontScaling={false}
      >
        {rank}
      </Animated.Text>
      <View style={styles.bracket} />
      <View style={styles.flex}>{children}</View>
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
    fontFamily: fonts.numerals,
    fontSize: 18,
    lineHeight: 22,
    color: colors.violet,
  },
  // `grid-cols-[38px_10px_1fr]`: rank, bracket, rows.
  tie: { flexDirection: "row" },
  tieRank: {
    alignSelf: "flex-start",
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
