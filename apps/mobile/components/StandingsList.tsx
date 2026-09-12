import { Pressable, StyleSheet, Text, View } from "react-native";

import { useFluidType } from "@/lib/fluid";
import { colors, fonts, radius, space } from "@/lib/theme";

export interface StandingsItem {
  name: string;
  count: number;
}

/**
 * Port of the rank logic in apps/web/src/components/standings/StandingsList.tsx:
 * equal counts share a rank, and repeated ranks are dimmed.
 */
function calculateRanks(items: StandingsItem[]) {
  let currentRank = 1;
  let previousCount = items[0]?.count ?? 0;
  let isRepeatedRank = false;

  return items.map((item, index) => {
    if (index > 0) {
      isRepeatedRank = item.count === previousCount;
      if (!isRepeatedRank) currentRank += 1;
    }
    previousCount = item.count;
    return { rank: currentRank, isRepeated: isRepeatedRank };
  });
}

export function StandingsList({
  title,
  items,
  onPressItem,
}: {
  title: string;
  items: StandingsItem[];
  onPressItem?: (name: string) => void;
}) {
  const t = useFluidType();
  const ranks = calculateRanks(items);

  return (
    <View style={styles.container}>
      <Text
        style={[styles.title, { fontSize: t.standingsTitle }]}
        allowFontScaling={false}
      >
        {title}
      </Text>

      <View style={styles.rows}>
        {items.map((item, index) => {
          const rank = ranks[index];
          return (
            <Pressable
              key={item.name}
              onPress={onPressItem ? () => onPressItem(item.name) : undefined}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.left}>
                <Text
                  style={[
                    styles.rank,
                    { fontSize: t.standingsNumber },
                    rank?.isRepeated && styles.rankRepeated,
                  ]}
                  allowFontScaling={false}
                >
                  <Text
                    style={[
                      styles.rankHash,
                      { fontSize: t.standingsHash },
                      rank?.isRepeated && styles.rankHashRepeated,
                    ]}
                  >
                    #
                  </Text>
                  {rank?.rank}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.name, { fontSize: t.standingsName }]}
                >
                  {item.name}
                </Text>
              </View>

              <Text
                style={[styles.count, { fontSize: t.standingsName }]}
                allowFontScaling={false}
              >
                {item.count}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontFamily: fonts.black,
    color: colors.yellow,
    marginBottom: space.sm,
  },
  rows: { gap: space.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.rowIdle,
    borderRadius: radius.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    gap: space.sm,
  },
  rowPressed: { backgroundColor: colors.rowActive },
  left: { flexDirection: "row", alignItems: "baseline", gap: 6, flexShrink: 1 },
  rank: { fontFamily: fonts.black, color: colors.pink },
  rankRepeated: { color: "rgba(255, 0, 255, 0.5)" },
  rankHash: { color: "rgba(255, 0, 255, 0.5)" },
  rankHashRepeated: { color: "rgba(255, 0, 255, 0.2)" },
  name: { fontFamily: fonts.black, color: colors.white, flexShrink: 1 },
  count: { fontFamily: fonts.black, color: colors.yellow },
});
