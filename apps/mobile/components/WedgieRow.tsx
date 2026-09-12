import { Pressable, StyleSheet, Text, View } from "react-native";

import { CourtPositionDiagram } from "@/components/CourtPositionDiagram";
import { useFluidType } from "@/lib/fluid";
import { colors, fonts, radius, space } from "@/lib/theme";
import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";

export interface WedgieRowData {
  id: number;
  number: number;
  playerName: string;
  teamName: string;
  teamAgainstName: string;
  wedgieDate: string;
  position: { x: number; y: number };
  types: { name: string }[];
}

const TILE_WIDTH = 74;
const COURT_WIDTH = 68;

/**
 * Port of apps/web/src/components/home/Wedgie.tsx (the "default" variant):
 * a pink number tile with the date and a WATCH bar, the player and matchup,
 * and the court position on the right.
 */
export function WedgieRow({
  wedgie,
  first = false,
  last = false,
  onPress,
}: {
  wedgie: WedgieRowData;
  first?: boolean;
  last?: boolean;
  onPress: () => void;
}) {
  const t = useFluidType();

  const cornerStyle = [first && styles.firstRow, last && styles.lastRow].filter(
    Boolean,
  );

  const tileCorners = [
    first && styles.tileFirst,
    last && styles.tileLast,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        ...cornerStyle,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.tile, ...tileCorners]}>
        <View style={styles.tileTop}>
          <Text
            style={[styles.hash, { fontSize: t.wedgieHash }]}
            allowFontScaling={false}
          >
            #
          </Text>
          <Text
            style={[styles.number, { fontSize: t.wedgieNumber }]}
            allowFontScaling={false}
          >
            {wedgie.number ?? 1}
          </Text>
        </View>

        <Text
          style={[styles.date, { fontSize: t.wedgieDate }]}
          allowFontScaling={false}
        >
          {formatTileDate(wedgie.wedgieDate)}
        </Text>

        <View style={[styles.watchBar, last && styles.watchBarLast]}>
          <Text
            style={[styles.watchText, { fontSize: t.watch }]}
            allowFontScaling={false}
          >
            WATCH
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text
          numberOfLines={1}
          style={[styles.player, { fontSize: t.playerName }]}
        >
          {wedgie.playerName}
        </Text>

        <Text numberOfLines={1} style={[styles.team, { fontSize: t.teamName }]}>
          <Text style={styles.teamName}>{wedgie.teamName}</Text>
          {wedgie.teamAgainstName.includes("Unknown")
            ? ""
            : ` - ${wedgie.teamAgainstName}`}
        </Text>

        {wedgie.types.length > 0 ? (
          <Text numberOfLines={1} style={[styles.types, { fontSize: t.types }]}>
            {wedgie.types
              .map((type) => type.name)
              .join(", ")
              .toUpperCase()}
          </Text>
        ) : null}
      </View>

      <View style={styles.court}>
        <CourtPositionDiagram
          position={wedgie.position}
          width={COURT_WIDTH}
          dotSize={10}
        />
      </View>
    </Pressable>
  );
}

/** The web tile shows a GEMS emoji on those dates, otherwise de-DE dd.mm.yy. */
function formatTileDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (isGemsDate(date)) return GEMS_EMOJI;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.sm,
    overflow: "hidden",
    backgroundColor: colors.rowIdle,
  },
  rowPressed: { backgroundColor: colors.rowActive },
  firstRow: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  lastRow: {
    marginBottom: 0,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },

  tile: {
    width: TILE_WIDTH,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.darkpurple,
    backgroundColor: colors.pink,
    borderRadius: radius.xs,
  },
  tileFirst: { borderTopLeftRadius: radius.xl },
  tileLast: { borderBottomLeftRadius: radius.xl },
  tileTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: space.xs,
  },
  hash: {
    fontFamily: fonts.bold,
    color: "rgba(18, 0, 46, 0.5)",
    marginRight: -3,
  },
  number: { fontFamily: fonts.black, color: colors.yellow },
  date: {
    fontFamily: fonts.black,
    color: colors.darkpurple,
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  watchBar: {
    width: "100%",
    backgroundColor: colors.yellow,
    borderTopWidth: 1,
    borderTopColor: colors.yellow,
    paddingVertical: 2,
    alignItems: "center",
  },
  watchBarLast: { borderBottomLeftRadius: radius.xl },
  watchText: { fontFamily: fonts.bold, color: colors.darkpurple },

  body: { flex: 1, minWidth: 0, paddingHorizontal: space.sm },
  player: { fontFamily: fonts.bold, color: colors.yellow, paddingBottom: 2 },
  team: { fontFamily: fonts.bold, color: colors.white },
  teamName: { color: colors.pink },
  types: {
    fontFamily: fonts.bold,
    color: colors.white60,
    letterSpacing: 0.5,
    marginTop: 1,
  },

  court: { width: COURT_WIDTH, paddingRight: space.xs },
});
