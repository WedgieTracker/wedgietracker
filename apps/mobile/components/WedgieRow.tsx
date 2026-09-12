import { Pressable, StyleSheet, Text, View } from "react-native";

import { CourtPositionDiagram } from "@/components/CourtPositionDiagram";
import { pickVideoForApp } from "@/components/WedgiePlayer";
import { useFluidType } from "@/lib/fluid";
import { colors, fonts, radius, space } from "@/lib/theme";
import type { VideoUrls } from "@wedgietracker/core/types/wedgie";
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
  videoUrl: VideoUrls | null;
}

const TILE_WIDTH = 74;
const COURT_WIDTH = 68;

/** Tailwind's `rounded-xl`, which the web rows use. */
const XL = 12;

/**
 * Port of apps/web/src/components/home/Wedgie.tsx.
 *
 * `default` is the home list, where the rows butt together and only the outer
 * corners of the stack round. `small` is the all-wedgies grid, where every
 * card is rounded on its own.
 */
export function WedgieRow({
  wedgie,
  variant = "default",
  first = false,
  last = false,
  onPress,
}: {
  wedgie: WedgieRowData;
  variant?: "default" | "small";
  first?: boolean;
  last?: boolean;
  onPress: () => void;
}) {
  const t = useFluidType();
  const small = variant === "small";

  const rowShape = small
    ? [styles.rowSmall]
    : [first && styles.rowFirst, last && styles.rowLast];

  const tileShape = small
    ? [styles.tileSmall]
    : [styles.tileDefault, first && styles.tileFirst, last && styles.tileLast];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        ...rowShape,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.tile, ...tileShape]}>
        {/*
          The web renders the hash and the number as inline spans, so they
          share a baseline and the small hash sits at the number's foot.
        */}
        <View style={styles.tileTop}>
          <Text
            style={[styles.hash, tight(t.wedgieHash)]}
            allowFontScaling={false}
          >
            #
          </Text>
          <Text
            style={[styles.number, tight(t.wedgieNumber)]}
            allowFontScaling={false}
          >
            {wedgie.number ?? 1}
          </Text>
        </View>

        <Text
          style={[
            styles.date,
            tight(t.wedgieDate),
            // Numerals have no descenders, so the space the font reserves
            // below the baseline reads as a gap. Pull the date back up into it.
            { marginTop: -0.12 * t.wedgieNumber },
          ]}
          allowFontScaling={false}
        >
          {formatTileDate(wedgie.wedgieDate)}
        </Text>

        <View style={styles.watchBar}>
          <Text
            style={[styles.watchText, tight(t.watch)]}
            allowFontScaling={false}
          >
            {pickVideoForApp(wedgie.videoUrl) ? "WATCH" : "NO CLIP"}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.player, tight(t.playerName)]}>
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

/** `leading-none`, so the hash and number share a predictable baseline. */
function tight(fontSize: number) {
  return { fontSize, lineHeight: fontSize };
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
  // default: only the outer corners of the stack round
  rowFirst: { borderTopLeftRadius: XL, borderTopRightRadius: XL },
  rowLast: {
    marginBottom: 0,
    borderBottomLeftRadius: XL,
    borderBottomRightRadius: XL,
  },
  // small: every card stands on its own
  rowSmall: { borderRadius: XL, marginBottom: space.md },

  tile: {
    width: TILE_WIDTH,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.darkpurple,
    backgroundColor: colors.pink,
  },
  tileDefault: { borderRadius: radius.xs },
  tileFirst: { borderTopLeftRadius: XL },
  tileLast: { borderBottomLeftRadius: XL },
  tileSmall: { borderRadius: XL },

  tileTop: {
    flexDirection: "row",
    // Shared baseline, as with the web's inline spans.
    alignItems: "baseline",
    marginTop: space.sm,
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
    marginBottom: space.xs,
  },
  watchBar: {
    width: "100%",
    backgroundColor: colors.yellow,
    borderTopWidth: 1,
    borderTopColor: colors.yellow,
    paddingVertical: 3,
    alignItems: "center",
  },
  watchText: { fontFamily: fonts.bold, color: colors.darkpurple },

  body: { flex: 1, minWidth: 0, paddingHorizontal: space.sm },
  player: { fontFamily: fonts.bold, color: colors.yellow, paddingBottom: 3 },
  team: { fontFamily: fonts.bold, color: colors.white },
  teamName: { color: colors.pink },
  types: {
    fontFamily: fonts.bold,
    color: colors.white60,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  court: { width: COURT_WIDTH, paddingRight: space.xs },
});
