import type { GameTimeline as Timeline } from "@wedgietracker/core/utils/gameMoment";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/lib/theme";

const TONE = {
  normal: {
    dot: colors.yellow,
    fill: "rgba(255,255,255,0.35)",
    text: colors.yellow,
  },
  clutch: { dot: colors.pink, fill: "rgba(255,0,255,0.5)", text: colors.pink },
  garbage: {
    dot: "rgba(255,255,255,0.7)",
    fill: "rgba(255,255,255,0.25)",
    text: colors.white60,
  },
} as const;

/**
 * Port of apps/web/src/components/home/GameTimeline.tsx: the game as a row of
 * quarters, filled up to the moment of the wedgie, with the band underneath.
 */
export function GameTimeline({ timeline }: { timeline: Timeline }) {
  const tone = TONE[timeline.tone];
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`When: ${timeline.label}`}
    >
      <View style={styles.row}>
        {timeline.segments.map((segment, i) => {
          const filled =
            i < timeline.active
              ? 1
              : i === timeline.active
                ? timeline.progress
                : 0;
          const active = i === timeline.active;
          return (
            <View key={segment} style={styles.segment}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${filled * 100}%`, backgroundColor: tone.fill },
                  ]}
                />
                {active ? (
                  <View
                    style={[
                      styles.dot,
                      {
                        left: `${timeline.progress * 100}%`,
                        backgroundColor: tone.dot,
                      },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[styles.segmentLabel, active && { color: tone.text }]}
                allowFontScaling={false}
              >
                {segment}
              </Text>
            </View>
          );
        })}
      </View>
      <Text
        style={[styles.label, { color: tone.text }]}
        allowFontScaling={false}
      >
        {timeline.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", maxWidth: 320 },
  row: { flexDirection: "row", gap: 4 },
  segment: { flex: 1 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  fill: { position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 3 },
  dot: {
    position: "absolute",
    top: -3,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.darkpurpleDark,
  },
  segmentLabel: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  label: {
    marginTop: 4,
    fontFamily: fonts.black,
    fontSize: 12,
    letterSpacing: 1,
  },
});
