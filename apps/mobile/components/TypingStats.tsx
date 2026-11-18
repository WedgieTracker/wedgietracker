import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, fonts } from "@/lib/theme";

export interface StatsPerWedgie {
  fga: number;
  possessions: number;
  games: number;
  minutes: number;
}

/** `word` is shown on the flaps; `spoken` is read to screen readers. */
const STATS: { key: keyof StatsPerWedgie; word: string; spoken: string }[] = [
  { key: "possessions", word: "POSS.", spoken: "possessions" },
  { key: "fga", word: "SHOTS", spoken: "shots" },
  { key: "games", word: "GAMES", spoken: "games" },
  { key: "minutes", word: "MINUTES", spoken: "minutes" },
];
/** Digit flaps: up to 9999, written without a thousands comma. */
const NUM_FLAPS = 4;
/** Letter flaps: the longest word, MINUTES. */
const WORD_FLAPS = 7;
/** The board's width in flap widths: digits, a half-width gap, letters. */
const UNITS = NUM_FLAPS + 0.5 + WORD_FLAPS;
const FLAP_GAP = 3;
const BOARD_PAD = 12;
/** The figure's flaps only carry digits, the word's only letters. */
const DIGITS = " 0123456789";
const LETTERS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ.";
const STEP_MS = 45;
const HOLD_MS = 4200;
const AMBER = "#FFD36B";

/** The board's text for one stat: the figure right-aligned, the word left. */
function boardText(stats: StatsPerWedgie, i: number) {
  const s = STATS[i % STATS.length]!;
  const raw = Number.isFinite(stats[s.key]) ? stats[s.key] : 0;
  const value = Math.min(Math.round(raw), 9999);
  return {
    digits: [...String(value).padStart(NUM_FLAPS, " ")],
    word: [...s.word.padEnd(WORD_FLAPS, " ").slice(0, WORD_FLAPS)],
  };
}

/** One flap. It steps through its characters in order until it reaches `target`. */
function Flap({
  target,
  delay,
  amber,
  height,
  still,
}: {
  target: string;
  delay: number;
  amber: boolean;
  height: number;
  still: boolean;
}) {
  const [shown, setShown] = useState(still ? target : " ");
  const shownRef = useRef(shown);
  const flip = useSharedValue(1);

  useEffect(() => {
    if (still) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (shownRef.current === target) return;
      const chars = amber ? DIGITS : LETTERS;
      const next =
        chars[(chars.indexOf(shownRef.current) + 1) % chars.length] ?? " ";
      shownRef.current = next;
      setShown(next);
      flip.value = 0.6;
      flip.value = withTiming(1, { duration: STEP_MS });
      timer = setTimeout(step, STEP_MS);
    };
    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [target, delay, amber, still, flip]);

  const flipping = useAnimatedStyle(() => ({
    transform: [{ scaleY: flip.value }],
  }));

  return (
    <View
      style={[styles.flap, { width: height * 0.72, height, borderRadius: 4 }]}
    >
      <View style={styles.flapTop} />
      <Animated.Text
        style={[
          styles.flapText,
          {
            fontSize: height * 0.56,
            lineHeight: height,
          },
          amber && styles.amber,
          flipping,
        ]}
        allowFontScaling={false}
      >
        {shown}
      </Animated.Text>
      <View style={styles.seam} />
    </View>
  );
}

/**
 * Port of apps/web/src/components/stats-for-nerds/TypingStats.tsx: "A wedgie
 * every 2837 poss." on a board across the foot of the season card, a fixed
 * caption over a row of split flaps cycling through possessions, shots,
 * games and minutes. The flaps are sized from the board's width, so it
 * fills the card and never changes size. With reduced motion it holds still
 * on each figure.
 */
export function TypingStats({ stats }: { stats: StatsPerWedgie }) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const still = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => i + 1), HOLD_MS);
    return () => clearInterval(id);
  }, []);

  const text = boardText(stats, index);
  const current = STATS[index % STATS.length]!;
  const inner = width - BOARD_PAD * 2;
  // Gaps between flaps: one less than the flaps, plus the gap column's own two.
  const gaps = (NUM_FLAPS + WORD_FLAPS) * FLAP_GAP;
  const flapW = inner > 0 ? (inner - gaps) / UNITS : 0;
  const flapH = flapW / 0.72;

  return (
    <View
      style={styles.board}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`That's a wedgie every ${stats[current.key].toLocaleString("en-US")} ${current.spoken}`}
    >
      <Text
        style={[
          styles.caption,
          { fontSize: Math.min(20, Math.max(13, width * 0.042)) },
        ]}
        allowFontScaling={false}
      >
        A WEDGIE EVERY
      </Text>
      {flapW > 0 ? (
        <View style={styles.row}>
          {text.digits.map((ch, i) => (
            <Flap
              key={`d${i}`}
              target={ch}
              delay={i * 25}
              amber
              height={flapH}
              still={still}
            />
          ))}
          <View style={{ width: flapW * 0.5 }} />
          {text.word.map((ch, i) => (
            <Flap
              key={`w${i}`}
              target={ch}
              delay={(NUM_FLAPS + i) * 25}
              amber={false}
              height={flapH}
              still={still}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // `.wt-board`: edge to edge across the foot of the season card.
  board: {
    width: "100%",
    padding: BOARD_PAD,
    backgroundColor: "#0B0518",
  },
  // `.wt-board-label`: the fixed words, lit like a scoreboard caption.
  caption: {
    textAlign: "center",
    fontFamily: fonts.black,
    letterSpacing: 3,
    color: colors.cream,
    paddingBottom: 8,
    textShadowColor: "rgba(240, 225, 182, 0.35)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  row: { flexDirection: "row", gap: FLAP_GAP },
  flap: { overflow: "hidden", backgroundColor: "#1B1036" },
  // The top half is a shade lighter, like the web's split gradient.
  flapTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#251847",
  },
  flapText: {
    textAlign: "center",
    fontFamily: fonts.black,
    color: colors.cream,
  },
  amber: {
    color: AMBER,
    textShadowColor: "rgba(255, 211, 107, 0.45)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  seam: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(5, 2, 12, 0.55)",
  },
});
