import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, space } from "@/lib/theme";

export interface StatsPerWedgie {
  fga: number;
  possessions: number;
  games: number;
  minutes: number;
}

const STATS_ORDER = ["fga", "possessions", "games", "minutes"] as const;
type StatKey = (typeof STATS_ORDER)[number];

const LABELS: Record<StatKey, string> = {
  fga: "FGA",
  possessions: "POSSESSIONS",
  games: "GAMES",
  minutes: "MINUTES PLAYED",
};

/**
 * Port of apps/web/src/components/stats-for-nerds/TypingStats.tsx - types out
 * "a wedgie every N <unit>", cycling through the four measures.
 */
export function TypingStats({ stats }: { stats: StatsPerWedgie }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const cancelled = useRef(false);

  const key = STATS_ORDER[index % STATS_ORDER.length] ?? "fga";

  useEffect(() => {
    cancelled.current = false;
    const value = stats[key];
    const target = `${Number.isNaN(value) ? 0 : value.toLocaleString()} ${LABELS[key]}`;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      // Erase whatever is on screen, then type the next measure.
      for (let i = text.length; i >= 0; i--) {
        if (cancelled.current) return;
        await wait(50);
        setText(text.slice(0, i));
      }
      await wait(500);
      for (let i = 0; i <= target.length; i++) {
        if (cancelled.current) return;
        await wait(100);
        setText(target.slice(0, i));
      }
      await wait(2000);
      if (cancelled.current) return;
      setIndex((n) => n + 1);
    };

    void run();
    return () => {
      cancelled.current = true;
    };
    // `text` is intentionally excluded: it is the animation's own output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, stats]);

  const [amount, ...rest] = text.split(" ");

  return (
    <View style={styles.panel}>
      <Text style={styles.lead} allowFontScaling={false}>
        THAT IS A WEDGIE EVERY
      </Text>
      <Text style={styles.value} allowFontScaling={false}>
        <Text style={styles.amount}>{amount}</Text>
        {rest.length > 0 ? (
          <Text style={styles.unit}> {rest.join(" ")}</Text>
        ) : null}
        <Caret />
      </Text>
    </View>
  );
}

/** The blinking block cursor from the web version's `animate-blink`. */
function Caret() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 500);
    return () => clearInterval(id);
  }, []);

  return <Text style={[styles.caret, !on && styles.caretOff]}>▌</Text>;
}

const styles = StyleSheet.create({
  panel: {
    width: "100%",
    backgroundColor: colors.darkpurpleLighter,
    minHeight: 84,
    alignItems: "center",
    justifyContent: "center",
    padding: space.md,
  },
  lead: { fontFamily: fonts.bold, color: colors.white, fontSize: 14 },
  value: { fontSize: 22, textAlign: "center", marginTop: 2 },
  amount: { fontFamily: fonts.black, color: colors.yellow },
  unit: { fontFamily: fonts.bold, color: colors.pink },
  caret: { color: colors.white },
  caretOff: { color: "transparent" },
});
