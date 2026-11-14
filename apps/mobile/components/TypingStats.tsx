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

const STATS: { key: keyof StatsPerWedgie; word: string }[] = [
  { key: "possessions", word: "POSSESSIONS" },
  { key: "fga", word: "SHOTS" },
  { key: "games", word: "GAMES" },
  { key: "minutes", word: "MINUTES" },
];
const NUM_FLAPS = 5;
const WORD_FLAPS = 11;
/** The figure's flaps only carry digits, the word's only letters. */
const DIGITS = " 0123456789,";
const LETTERS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STEP_MS = 45;
const HOLD_MS = 4200;
const AMBER = "#FFCF6B";

/** The board's text for one stat: the figure right-aligned, the word left. */
function boardText(stats: StatsPerWedgie, i: number) {
  const s = STATS[i % STATS.length]!;
  const value = Number.isFinite(stats[s.key]) ? stats[s.key] : 0;
  const num = value
    .toLocaleString("en-US")
    .padStart(NUM_FLAPS, " ")
    .slice(-NUM_FLAPS);
  return [...num, ...s.word.padEnd(WORD_FLAPS, " ").slice(0, WORD_FLAPS)];
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
      style={[styles.flap, { width: height * 0.68, height, borderRadius: 4 }]}
    >
      <View style={styles.flapTop} />
      <Animated.Text
        style={[
          styles.flapText,
          {
            fontSize: height * 0.62,
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
 * Port of apps/web/src/components/stats-for-nerds/TypingStats.tsx: "That's a
 * wedgie every 2,837 possessions" on a split-flap board that cycles through
 * possessions, shots, games and minutes. Five amber digit flaps, then eleven
 * letter flaps, so the board never changes width. With reduced motion it
 * holds still on each figure.
 */
export function TypingStats({
  stats,
  flapHeight = 22,
}: {
  stats: StatsPerWedgie;
  flapHeight?: number;
}) {
  const [index, setIndex] = useState(0);
  const still = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => i + 1), HOLD_MS);
    return () => clearInterval(id);
  }, []);

  const text = boardText(stats, index);
  const current = STATS[index % STATS.length]!;

  return (
    <View style={styles.wrap}>
      <Text style={styles.lead} allowFontScaling={false}>
        That&apos;s a wedgie every
      </Text>
      <View
        style={styles.board}
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${stats[current.key].toLocaleString("en-US")} ${current.word.toLowerCase()}`}
      >
        {text.map((ch, i) => (
          <View key={i} style={styles.slot}>
            {i === NUM_FLAPS ? <View style={styles.gap} /> : null}
            <Flap
              target={ch}
              delay={i * 25}
              amber={i < NUM_FLAPS}
              height={flapHeight}
              still={still}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12 },
  lead: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.cream },
  // `.wt-board`: dark inset tray.
  board: {
    flexDirection: "row",
    gap: 2,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#0B0518",
  },
  slot: { flexDirection: "row" },
  gap: { width: 8 },
  flap: { overflow: "hidden", backgroundColor: "#120A26" },
  // The top half is a shade lighter, like the web's split gradient.
  flapTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#1C1236",
  },
  flapText: {
    textAlign: "center",
    fontFamily: "Menlo-Bold",
    color: colors.cream,
  },
  amber: {
    color: AMBER,
    textShadowColor: "rgba(255, 207, 107, 0.45)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  seam: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#05020C",
  },
});
