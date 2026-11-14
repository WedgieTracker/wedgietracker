import { Pressable, StyleSheet, Text, View } from "react-native";

import { CourtPositionDiagram } from "@/components/CourtPositionDiagram";
import { PlayButton } from "@/components/PlayButton";
import { shortDate } from "@/lib/dates";
import { colors, fonts } from "@/lib/theme";
import type { VideoUrls } from "@wedgietracker/core/types/wedgie";

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

const COURT_WIDTH = 76;
const GAP = 12;

/**
 * Every row is this tall, so the skeleton's placeholders can match it and
 * the list lands without moving.
 */
export const WEDGIE_ROW_HEIGHT = 88;

/**
 * Port of apps/web/src/components/home/Wedgie.tsx: number and date, the
 * player (one line, allowed to run over the court), teams and types, the
 * court, and the gradient play button.
 */
export function WedgieRow({
  wedgie,
  onPress,
}: {
  wedgie: WedgieRowData;
  onPress: () => void;
}) {
  const opponent = wedgie.teamAgainstName.includes("Unknown")
    ? null
    : wedgie.teamAgainstName;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Watch wedgie ${wedgie.number}, ${wedgie.playerName}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.numberCol}>
        <Text style={styles.number} allowFontScaling={false}>
          <Text style={styles.hash}>#</Text>
          {wedgie.number ?? 1}
        </Text>
        <Text style={styles.date} allowFontScaling={false}>
          {shortDate(wedgie.wedgieDate)}
        </Text>
      </View>

      <View style={styles.body}>
        {/* Wider than its column, so a long name runs over the court. */}
        <Text numberOfLines={1} style={styles.player} allowFontScaling={false}>
          {wedgie.playerName}
        </Text>
        <Text numberOfLines={1} style={styles.teams} allowFontScaling={false}>
          <Text style={styles.teamCode}>{wedgie.teamName}</Text>
          {opponent ? ` vs ${opponent}` : ""}
        </Text>
        <Text numberOfLines={1} style={styles.types} allowFontScaling={false}>
          {wedgie.types.map((type) => type.name).join(", ")}
        </Text>
      </View>

      <CourtPositionDiagram
        position={wedgie.position}
        width={COURT_WIDTH}
        dotSize={7}
      />

      <PlayButton />
    </Pressable>
  );
}

/** A row-sized placeholder for skeletons. */
export function WedgieRowPlaceholder() {
  return <View style={[styles.row, styles.placeholder]} />;
}

const styles = StyleSheet.create({
  // `grid-cols-[58px_minmax(0,1fr)_76px_30px] gap-3 rounded-[20px] border
  // py-3.5 pr-3.5 pl-[18px]`
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
    height: WEDGIE_ROW_HEIGHT,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.violet20,
    backgroundColor: colors.panel,
  },
  rowPressed: { borderColor: colors.violet60 },
  placeholder: { backgroundColor: "rgba(29, 18, 66, 0.6)", borderWidth: 0 },

  numberCol: { width: 58 },
  number: {
    fontFamily: fonts.blackItalic,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -1.4,
    color: colors.cream,
  },
  // `text-[0.42em] opacity-55`, on the number's baseline.
  hash: { fontSize: 15, letterSpacing: 0, color: "rgba(240, 225, 182, 0.55)" },
  date: {
    marginTop: 3,
    fontFamily: fonts.bold,
    fontSize: 10.5,
    lineHeight: 13,
    color: colors.cream50,
  },

  body: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
    marginRight: -(COURT_WIDTH + GAP),
  },
  // Kept clear of the court lines it runs over by a glow of the panel colour.
  player: {
    fontFamily: fonts.extraBold,
    fontSize: 16.5,
    lineHeight: 20,
    color: colors.cream,
    textShadowColor: colors.panel,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  teams: {
    marginTop: 4,
    marginRight: COURT_WIDTH + GAP,
    fontFamily: fonts.bold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.cream80,
  },
  teamCode: { fontFamily: fonts.black, color: colors.violet },
  types: {
    marginTop: 2,
    marginRight: COURT_WIDTH + GAP,
    fontFamily: fonts.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.cream50,
  },
});
