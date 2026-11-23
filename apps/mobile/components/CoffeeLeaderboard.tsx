import { StyleSheet, Text, View } from "react-native";

import { CoffeeCup } from "@/components/CoffeeCup";
import { GradientFill, Grain } from "@/components/Gradient";
import type { RouterOutputs } from "@/lib/api";
import { badgeTextShadow, colors, fonts } from "@/lib/theme";

type Board = RouterOutputs["donations"]["getCoffeeBoard"];
type Row = Board["rows"][number];

/** Shared places for ties: 5, 3, 3, 1 rank 1, 2, 2, 4. */
function ranked(rows: Row[]) {
  return rows.map((row) => ({
    ...row,
    rank: rows.findIndex((r) => r.coffees === row.coffees) + 1,
  }));
}

/** By rank: first tallest, then second, then third; a tie shares a height. */
const HEIGHTS = [112, 80, 56];
// Second, first, third, as podiums stand.
const ORDER = [1, 0, 2];

function Name({
  name,
  size,
  left = false,
}: {
  name: string | null;
  size: number;
  left?: boolean;
}) {
  return (
    <Text
      numberOfLines={1}
      allowFontScaling={false}
      style={[
        styles.name,
        { fontSize: size },
        left && styles.nameLeft,
        !name && styles.anonymous,
      ]}
    >
      {name ?? "Anonymous"}
    </Text>
  );
}

function Cups({ n }: { n: number }) {
  const shown = Math.min(n, 3);
  return (
    <View style={styles.cups}>
      {Array.from({ length: shown }, (_, i) => (
        <CoffeeCup key={i} width={18} full steam={false} />
      ))}
      {n > shown ? (
        <Text style={styles.more} allowFontScaling={false}>
          +{n - shown}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Port of apps/web/src/components/support/CoffeeLeaderboard.tsx: this
 * season's top three on a podium, the rest listed under it, and dashed
 * places inviting the next buyers.
 */
export function CoffeeLeaderboard({ board }: { board: Board }) {
  const all = ranked(board.rows);
  const top = [0, 1, 2].map((i) => all[i] ?? null);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text
          style={styles.title}
          accessibilityRole="header"
          allowFontScaling={false}
        >
          Coffee leaderboard
        </Text>
        {board.season ? (
          <Text style={styles.season} allowFontScaling={false}>
            {board.season}
          </Text>
        ) : null}
      </View>

      <View style={styles.panel}>
        <View style={styles.podium}>
          {ORDER.map((place) => {
            const r = top[place];
            return (
              <View key={place} style={styles.place}>
                {r ? (
                  <View
                    style={styles.placeInner}
                    accessible
                    accessibilityLabel={`Place ${r.rank}, ${r.name ?? "Anonymous"}, ${r.coffees} ${r.coffees === 1 ? "coffee" : "coffees"}`}
                  >
                    <Cups n={r.coffees} />
                    <Name name={r.name} size={14} />
                    <View
                      style={[
                        styles.stand,
                        { height: HEIGHTS[r.rank - 1] ?? HEIGHTS[2] },
                      ]}
                    >
                      <GradientFill name="badge" radius={12} />
                      <Grain radius={12} />
                      <Text
                        style={[styles.standNumber, badgeTextShadow(30)]}
                        allowFontScaling={false}
                      >
                        {r.coffees}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeInner}>
                    <Text
                      style={styles.empty}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                      allowFontScaling={false}
                    >
                      Your name here
                    </Text>
                    <View
                      style={[styles.emptyStand, { height: HEIGHTS[place] }]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {all.length > 3 ? (
          <View style={styles.list}>
            {all.slice(3).map((r, i) => (
              <View
                key={i}
                style={[styles.listRow, i > 0 && styles.listRowLine]}
                accessible
                accessibilityLabel={`Place ${r.rank}, ${r.name ?? "Anonymous"}, ${r.coffees} ${r.coffees === 1 ? "coffee" : "coffees"}`}
              >
                <Text style={styles.listRank} allowFontScaling={false}>
                  {r.rank}
                </Text>
                <View style={styles.listName}>
                  <Name name={r.name} size={14} left />
                </View>
                <Text style={styles.listCoffees} allowFontScaling={false}>
                  {r.coffees}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Text style={styles.note} allowFontScaling={false}>
        Buy a coffee to get your name on the board, or stay anonymous.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 12 },
  head: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontFamily: fonts.black,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.cream,
  },
  season: { fontFamily: fonts.bold, fontSize: 12, color: colors.cream50 },
  panel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.panel,
  },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  place: { width: "30%", minWidth: 0 },
  placeInner: { alignItems: "center", gap: 8 },
  cups: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  more: {
    marginLeft: 4,
    fontFamily: fonts.black,
    fontSize: 12,
    color: "rgba(240, 225, 182, 0.6)",
  },
  name: {
    width: "100%",
    textAlign: "center",
    fontFamily: fonts.extraBold,
    color: colors.cream,
  },
  nameLeft: { textAlign: "left" },
  anonymous: { fontStyle: "italic", color: "rgba(240, 225, 182, 0.55)" },
  stand: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  standNumber: {
    fontFamily: fonts.numerals,
    fontSize: 30,
    lineHeight: 36,
    paddingRight: 2,
    color: colors.cream,
  },
  empty: {
    width: "100%",
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "rgba(240, 225, 182, 0.4)",
  },
  emptyStand: {
    width: "100%",
    borderWidth: 2,
    borderBottomWidth: 0,
    borderStyle: "dashed",
    borderColor: colors.cream20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  list: { marginTop: 12 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  listRowLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(154, 92, 245, 0.15)",
  },
  listRank: {
    width: 36,
    textAlign: "right",
    fontFamily: fonts.numerals,
    fontSize: 16,
    lineHeight: 20,
    color: colors.violet,
  },
  listName: { flex: 1, minWidth: 0 },
  listCoffees: {
    width: 40,
    textAlign: "right",
    fontFamily: fonts.numerals,
    fontSize: 20,
    lineHeight: 24,
    paddingRight: 2,
    color: colors.cream,
  },
  note: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "rgba(240, 225, 182, 0.55)",
  },
});
