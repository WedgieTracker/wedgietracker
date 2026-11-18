import { StyleSheet, Text, View } from "react-native";

import { GradientFill, Grain } from "@/components/Gradient";
import { StickerButton } from "@/components/StickerButton";

const AMBER = "#FFD36B";
const PINK = "#FF6FD8";
// The board's LED face. Menlo is on every iPhone.
const LED = "Menlo-Bold";

/** One side of the board: a label over glowing LED digits. */
function Board({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "amber" | "pink";
}) {
  const color = tone === "amber" ? AMBER : PINK;
  return (
    <View style={styles.board}>
      <Text style={[styles.led, styles.boardLabel]} allowFontScaling={false}>
        {label}
      </Text>
      <Text
        style={[
          styles.led,
          styles.digits,
          { color, textShadowColor: color },
          value === null && styles.invisible,
        ]}
        allowFontScaling={false}
      >
        {String(value ?? 0).padStart(2, "0")}
      </Text>
    </View>
  );
}

/**
 * Port of apps/web/src/components/home/CoffeeScoreboard.tsx: this season's
 * coffees against this season's wedgies, like a game score. With `data`
 * null it keeps its shape, empty, while the numbers load.
 */
export function CoffeeScoreboard({
  data,
  onSupport,
}: {
  data: { season: string | null; coffees: number; wedgies: number } | null;
  /** The button to the support screen; left out on the support screen. */
  onSupport?: () => void;
}) {
  const lead = data ? data.coffees - data.wedgies : 0;
  const line =
    lead > 0
      ? `Coffees lead by ${lead}`
      : lead < 0
        ? "Every coffee scores a point"
        : "All square";

  return (
    <View
      style={styles.frame}
      accessible={!onSupport}
      accessibilityLabel={
        data
          ? `Season score: coffees ${data.coffees}, wedgies ${data.wedgies}`
          : undefined
      }
    >
      <GradientFill name="badge" radius={16} />
      <Grain radius={16} />
      <Text
        style={[styles.led, styles.season, !data && styles.invisible]}
        allowFontScaling={false}
      >
        {`SEASON ${data?.season ?? "0000/00"}`}
      </Text>
      <View style={styles.boards}>
        <Board label="COFFEES" value={data?.coffees ?? null} tone="amber" />
        <Board label="WEDGIES" value={data?.wedgies ?? null} tone="pink" />
      </View>
      <Text
        style={[styles.led, styles.line, !data && styles.invisible]}
        allowFontScaling={false}
      >
        {line.toUpperCase()}
      </Text>
      {onSupport ? (
        <StickerButton
          label="Support us with a coffee"
          onPress={onSupport}
          variant="dark"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // `bg-badge grain rounded-[18px] border-2 border-cream/35 p-3.5`
  frame: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(240, 225, 182, 0.35)",
    overflow: "hidden",
  },
  // Letter spacing also trails the last letter, so the same space on the
  // left keeps it centred.
  led: { fontFamily: LED, letterSpacing: 1.6, paddingLeft: 1.6 },
  season: {
    textAlign: "center",
    fontSize: 11,
    color: AMBER,
    textShadowColor: "rgba(255, 211, 107, 0.6)",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  boards: { flexDirection: "row", gap: 10, marginVertical: 12 },
  board: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 0,
    borderRadius: 10,
    backgroundColor: "rgba(10, 4, 30, 0.45)",
  },
  boardLabel: { fontSize: 11, color: "rgba(240, 225, 182, 0.75)" },
  // iOS clips a text shadow to the text's own box, so the glow needs room
  // inside it: padding around the digits rather than margin.
  digits: {
    fontSize: 54,
    lineHeight: 60,
    // At least the glow's radius on every side. Left is the right side plus
    // the letter spacing the last digit trails, so the pair sits centred
    // under its label (the led style's own paddingLeft would otherwise win).
    paddingLeft: 12 + 1.6,
    paddingRight: 12,
    paddingVertical: 10,
    fontVariant: ["tabular-nums"],
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  line: {
    textAlign: "center",
    fontSize: 11.5,
    color: "rgba(240, 225, 182, 0.6)",
  },
  invisible: { opacity: 0 },
  button: { marginTop: 12 },
});
