import { useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { GradientFill } from "@/components/Gradient";
import { gradients } from "@/lib/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CREST_HEIGHT = 50;

/**
 * The `#gentle-wave` path from apps/web/src/components/home/Wave.tsx, placed
 * at `x` and dropped by `y`. Everything after the first move is relative, so
 * moving the start moves the whole wave while the gradient stays put in the
 * SVG's own space, as the web's mask keeps it.
 */
function wavePath(x: number, y: number) {
  "worklet";
  return `M${x - 160} ${44 + y}c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z`;
}

/**
 * Four copies of the wave at different speeds, matching the
 * `.parallax > use:nth-child()` rules in globals.css. The back three are
 * translucent blue and violet, the front one carries the fill's gradient.
 */
const LAYERS = [
  { y: 0, fill: "rgba(95, 132, 230, 0.4)", duration: 7000, delay: 2000 },
  { y: 3, fill: "rgba(166, 95, 245, 0.3)", duration: 10000, delay: 3000 },
  { y: 5, fill: "rgba(123, 107, 240, 0.2)", duration: 13000, delay: 4000 },
  { y: 7, fill: null, duration: 20000, delay: 5000 },
] as const;

/** `translate3d(-90px) -> translate3d(85px)`, in the SVG's own units. */
const FROM = -90;
const TO = 85;
const EASE = Easing.bezier(0.55, 0.5, 0.45, 0.5);

/**
 * Port of the web app's Wave: a gradient fill that rises to `fillPercentage`
 * of the container, topped by a parallax wave crest.
 */
export function Wave({
  fillPercentage,
  containerHeight,
}: {
  fillPercentage: number;
  containerHeight: number;
}) {
  const height = useSharedValue(0);

  useEffect(() => {
    if (containerHeight <= 0) return;

    // The web version resets to 0 then animates up, so the fill always reads
    // as filling rather than appearing.
    height.value = 0;
    const id = setTimeout(() => {
      height.value = withTiming((fillPercentage / 100) * containerHeight, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }, 100);
    return () => clearTimeout(id);
  }, [fillPercentage, containerHeight, height]);

  // The fill is the panel's full height, slid down so only `height` of it
  // shows (the panel clips the rest). A transform, rather than animating the
  // height, keeps the gradient inside laid out at its real size.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: containerHeight - height.value }],
  }));

  return (
    <Animated.View
      style={[styles.fill, { height: containerHeight }, fillStyle]}
      pointerEvents="none"
    >
      {/* Drawn once the panel has a size: an SVG first laid out at zero
          does not redraw when it grows. */}
      {containerHeight > 0 ? <GradientFill name="glowX" /> : null}
      <View style={styles.crestBand}>
        <Crest />
      </View>
    </Animated.View>
  );
}

function Crest() {
  const id = `wave${useId().replace(/:/g, "")}`;
  const still = useReducedMotion();

  return (
    <Svg
      width="100%"
      height={CREST_HEIGHT}
      viewBox="0 24 150 28"
      preserveAspectRatio="none"
      style={styles.crest}
    >
      <Defs>
        <LinearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={0}
          x2={150}
          y1={0}
          y2={0}
        >
          {gradients.glowX.stops.map(([offset, color]) => (
            <Stop key={offset} offset={offset} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      {LAYERS.map((layer) => (
        <WaveLayer
          key={layer.y}
          y={layer.y}
          fill={layer.fill ?? `url(#${id})`}
          duration={layer.duration}
          delay={layer.delay}
          still={still}
        />
      ))}
    </Svg>
  );
}

function WaveLayer({
  y,
  fill,
  duration,
  delay,
  still,
}: {
  y: number;
  fill: string;
  duration: number;
  delay: number;
  still: boolean;
}) {
  // The web starts each layer partway through with a negative delay; this
  // starts each at the point that delay would have reached.
  const start = FROM + ((TO - FROM) * (delay % duration)) / duration;
  const shift = useSharedValue(start);

  useEffect(() => {
    if (still) return;
    // One trip at a time, jumping back to the start: the travel (175) is one
    // wavelength (176), so the jump does not show, as on the web.
    shift.value = withTiming(
      TO,
      { duration: (duration * (TO - start)) / (TO - FROM), easing: EASE },
      (finished) => {
        if (!finished) return;
        shift.value = FROM;
        shift.value = withRepeat(
          withTiming(TO, { duration, easing: EASE }),
          -1,
          false,
        );
      },
    );
    return () => cancelAnimation(shift);
  }, [duration, shift, start, still]);

  const animatedProps = useAnimatedProps(() => ({
    d: wavePath(48 + shift.value, y),
  }));
  return <AnimatedPath animatedProps={animatedProps} fill={fill} />;
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  crestBand: {
    position: "absolute",
    // Sits directly above the fill, like `bottom-full` on the web.
    bottom: "100%",
    left: 0,
    right: 0,
    height: CREST_HEIGHT,
    overflow: "hidden",
  },
  // `.waves { margin-bottom: -7px }`: the crest overlaps the fill's top edge.
  crest: { position: "absolute", left: 0, right: 0, bottom: -7 },
});
