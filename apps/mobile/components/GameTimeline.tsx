import type { GameTimeline as Timeline } from "@wedgietracker/core/utils/gameMoment";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

/** Off when the phone asks for reduced motion, like the web's media query. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => sub.remove();
  }, []);
  return reduce;
}

/** A 0 -> 1 value that repeats for as long as the component is shown. */
function useLoop(duration: number, enabled: boolean, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, enabled, delay]);
  return value;
}

/** Clutch time: a pink ring pulsing out of the dot. */
function ClutchRing({ animate }: { animate: boolean }) {
  const t = useLoop(1600, animate);
  if (!animate) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
          transform: [
            {
              scale: t.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.8],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** Garbage time: a little "z" drifting up from the dot, as if dozing off. */
function Snooze({ animate, delay }: { animate: boolean; delay: number }) {
  const t = useLoop(2400, animate, delay);
  if (!animate) return null;
  return (
    <Animated.Text
      pointerEvents="none"
      allowFontScaling={false}
      style={[
        styles.snooze,
        {
          opacity: t.interpolate({
            inputRange: [0, 0.25, 1],
            outputRange: [0, 1, 0],
          }),
          transform: [
            {
              translateX: t.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 10],
              }),
            },
            {
              translateY: t.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -16],
              }),
            },
            {
              scale: t.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ],
        },
      ]}
    >
      z
    </Animated.Text>
  );
}

/** The label: a heartbeat for clutch time, a wobbling bin for garbage time. */
function Label({
  timeline,
  animate,
}: {
  timeline: Timeline;
  animate: boolean;
}) {
  const tone = TONE[timeline.tone];
  const beat = useLoop(1600, animate && timeline.tone === "clutch");
  const wobble = useLoop(2600, animate && timeline.tone === "garbage");
  const text = timeline.label.toUpperCase();

  if (timeline.tone === "clutch") {
    return (
      <Animated.Text
        allowFontScaling={false}
        style={[
          styles.label,
          { color: tone.text, alignSelf: "flex-start" },
          {
            transform: [
              {
                scale: beat.interpolate({
                  inputRange: [0, 0.1, 0.25, 0.4, 1],
                  outputRange: [1, 1.08, 1.04, 1, 1],
                }),
              },
            ],
          },
        ]}
      >
        {text}
      </Animated.Text>
    );
  }
  if (timeline.tone === "garbage") {
    return (
      <View style={styles.labelRow}>
        <Animated.Text
          allowFontScaling={false}
          style={[
            styles.label,
            {
              transform: [
                {
                  rotate: wobble.interpolate({
                    inputRange: [0, 0.25, 0.75, 1],
                    outputRange: ["0deg", "-12deg", "12deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
        >
          🗑️
        </Animated.Text>
        <Text
          style={[styles.label, { color: tone.text }]}
          allowFontScaling={false}
        >
          {text}
        </Text>
      </View>
    );
  }
  return (
    <Text style={[styles.label, { color: tone.text }]} allowFontScaling={false}>
      {text}
    </Text>
  );
}

/**
 * Port of apps/web/src/components/home/GameTimeline.tsx: the game as a row of
 * quarters, filled up to the moment of the wedgie, with the band underneath.
 */
export function GameTimeline({ timeline }: { timeline: Timeline }) {
  const tone = TONE[timeline.tone];
  const animate = !useReduceMotion();
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
                      styles.dotWrap,
                      { left: `${timeline.progress * 100}%` },
                    ]}
                  >
                    {timeline.tone === "clutch" ? (
                      <ClutchRing animate={animate} />
                    ) : null}
                    {timeline.tone === "garbage" ? (
                      <>
                        <Snooze animate={animate} delay={0} />
                        <Snooze animate={animate} delay={1200} />
                      </>
                    ) : null}
                    <View style={[styles.dot, { backgroundColor: tone.dot }]} />
                  </View>
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
      <Label timeline={timeline} animate={animate} />
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
  dotWrap: {
    position: "absolute",
    top: -3,
    width: 12,
    height: 12,
    marginLeft: -6,
  },
  dot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.darkpurpleDark,
  },
  ring: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 6,
    backgroundColor: colors.pink,
  },
  snooze: {
    position: "absolute",
    top: -4,
    left: 8,
    fontFamily: fonts.black,
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  segmentLabel: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  label: {
    marginTop: 4,
    fontFamily: fonts.black,
    fontSize: 12,
    letterSpacing: 1,
  },
});
