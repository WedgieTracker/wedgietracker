import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { GradientFill } from "@/components/Gradient";
import { colors, fonts } from "@/lib/theme";

/** The stamp's inks: the ball in pink, the banner and its lettering darker. */
const BALL_INK = "#ff4fc8";
const BANNER_INK = "#ad3792";

const WIDTH = 132;
const PAGE_MIN_HEIGHT = 118;
const BINDING = 26;

/**
 * Port of apps/web/src/components/home/DaysCalendar.tsx: a tear-off pad
 * counting the days since the last wedgie, with the sheets below peeking out.
 * On the day of a new one, "NEW WEDGIE!" is stamped over a faded zero.
 *
 * `hidden` draws the pad with nothing printed on it, for the skeleton.
 */
export function DaysCalendar({
  days,
  hidden = false,
}: {
  days: number;
  hidden?: boolean;
}) {
  const isNew = days === 0 && !hidden;
  const label = isNew
    ? "New wedgie today"
    : `${days} ${days === 1 ? "day" : "days"} without a wedgie`;

  return (
    <View
      style={styles.pad}
      accessible={!hidden}
      accessibilityRole="image"
      accessibilityLabel={hidden ? undefined : label}
    >
      {/* the sheets underneath, a little turned and peeking out */}
      <View style={[styles.sheet, styles.sheetBack]} />
      <View style={[styles.sheet, styles.sheetMiddle]} />

      <View style={styles.binding}>
        <GradientFill name="glow" />
        <View style={[styles.ring, { left: 26 }]} />
        <View style={[styles.ring, { right: 26 }]} />
      </View>

      <View style={styles.page}>
        <Text
          style={[styles.count, isNew && styles.faded, hidden && styles.hidden]}
          allowFontScaling={false}
        >
          {days}
        </Text>
        <Text
          style={[
            styles.caption,
            isNew && styles.faded,
            hidden && styles.hidden,
          ]}
          allowFontScaling={false}
        >
          {days === 1 ? "day" : "days"} without{"\n"}a wedgie
        </Text>
        {isNew ? <NewWedgieStamp /> : null}
      </View>
    </View>
  );
}

/**
 * Rubber-stamped "NEW WEDGIE!": a reversed basketball (solid ink, seams left
 * in the paper) behind an inked banner. A patch of plain paper under the
 * banner stops the ball's lines at its edge, as a real stamp prints, and
 * keeps the lettering clear of the faded count. It thumps down once, then the
 * ball's seams spin slowly.
 */
function NewWedgieStamp() {
  const still = useReducedMotion();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const thump = useSharedValue(still ? 1 : 0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    thump.value = withDelay(
      200,
      withTiming(1, {
        duration: 450,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1.3),
      }),
    );
    spin.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(360, { duration: 6000, easing: Easing.linear }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(thump);
      cancelAnimation(spin);
    };
  }, [still, thump, spin]);

  // `wt-stamp-in`: from 2.2x and clear, past 0.92x, settling at 1x.
  const stampStyle = useAnimatedStyle(() => {
    const t = thump.value;
    const scale =
      t < 0.6 ? 2.2 - (1.28 * t) / 0.6 : 0.92 + (0.08 * (t - 0.6)) / 0.4;
    return {
      opacity: Math.min(1, t / 0.6),
      transform: [{ rotate: "-10deg" }, { scale }],
    };
  });
  const patchStyle = useAnimatedStyle(() => ({ opacity: thump.value }));
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  // The artwork is drawn on a 120 by 104 grid, as the web SVG is.
  const s = box.width / 120;

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.patch, patchStyle]} />
      <View
        pointerEvents="none"
        style={styles.stampBox}
        onLayout={(e) => setBox(e.nativeEvent.layout)}
      >
        {s > 0 ? (
          <Animated.View style={[StyleSheet.absoluteFill, stampStyle]}>
            <Animated.View
              style={[
                styles.ball,
                { left: 10 * s, top: 2 * s, width: 100 * s, height: 100 * s },
                spinStyle,
              ]}
            >
              <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Circle cx={50} cy={50} r={48} fill={BALL_INK} />
                <Path
                  d="M4 50h92M50 4v92M18 18q22 32 0 64M82 18q-22 32 0 64"
                  fill="none"
                  stroke={colors.cream}
                  strokeWidth={3.5}
                />
              </Svg>
            </Animated.View>
            {/* The paper the banner cuts out of the ball. */}
            <View
              style={[
                styles.cut,
                {
                  left: -2 * s,
                  top: 26 * s,
                  width: 124 * s,
                  height: 52 * s,
                  borderRadius: 8 * s,
                },
              ]}
            />
            <View
              style={[
                styles.banner,
                {
                  left: 2 * s,
                  top: 30 * s,
                  width: 116 * s,
                  height: 44 * s,
                  borderRadius: 6 * s,
                  borderWidth: 3.5 * s,
                },
              ]}
            >
              <Text
                style={[
                  styles.bannerText,
                  { fontSize: 19 * s, lineHeight: 19 * s },
                ]}
                allowFontScaling={false}
              >
                NEW
              </Text>
              <Text
                style={[
                  styles.bannerText,
                  { fontSize: 19 * s, lineHeight: 19 * s },
                ]}
                allowFontScaling={false}
              >
                WEDGIE!
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </>
  );
}

const SHEET_SHADOW = {
  shadowColor: "#050214",
  shadowOpacity: 0.35,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 6 },
} as const;

const styles = StyleSheet.create({
  pad: {
    width: WIDTH,
    borderRadius: 14,
    backgroundColor: colors.cream,
    shadowColor: "#050214",
    shadowOpacity: 0.45,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 8 },
  },
  sheet: {
    position: "absolute",
    top: BINDING,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    ...SHEET_SHADOW,
  },
  sheetBack: {
    left: 5,
    right: 5,
    bottom: -10,
    backgroundColor: "#ddcc98",
    transform: [{ rotate: "1.6deg" }],
  },
  sheetMiddle: {
    left: 2,
    right: 2,
    bottom: -5,
    backgroundColor: "#e8d9ab",
    transform: [{ rotate: "-1.4deg" }],
  },
  binding: {
    height: BINDING,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "visible",
  },
  // The two rings that hold the pad, standing proud of the binding.
  ring: {
    position: "absolute",
    top: -6,
    width: 8,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.cream,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 2 },
  },
  page: {
    minHeight: PAGE_MIN_HEIGHT,
    backgroundColor: colors.cream,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 14,
  },
  count: {
    fontFamily: fonts.blackItalic,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -2.5,
    color: "#502394",
  },
  caption: {
    marginTop: 2,
    fontFamily: fonts.black,
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
    color: colors.night,
  },
  faded: { opacity: 0.3 },
  hidden: { opacity: 0 },

  patch: {
    position: "absolute",
    // Centred at 52% down, as the web's translate puts it.
    top: "33.5%",
    left: "8%",
    width: "84%",
    height: "37%",
    borderRadius: 6,
    backgroundColor: colors.cream,
    transform: [{ rotate: "-10deg" }],
  },
  stampBox: {
    position: "absolute",
    left: "6%",
    width: "88%",
    top: "15%",
    height: "74%",
  },
  ball: { position: "absolute" },
  cut: { position: "absolute", backgroundColor: colors.cream },
  banner: {
    position: "absolute",
    borderColor: BANNER_INK,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    fontFamily: fonts.marker,
    color: BANNER_INK,
    textAlign: "center",
    includeFontPadding: false,
  },
});
