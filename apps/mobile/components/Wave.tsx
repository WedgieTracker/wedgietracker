import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/lib/theme";

/** The `#gentle-wave` path from apps/web/src/components/home/Wave.tsx */
const GENTLE_WAVE =
  "M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z";

const CREST_HEIGHT = 50;

/**
 * Four copies of the wave at different speeds and opacities, matching the
 * `.parallax > use:nth-child()` animation durations in globals.css.
 */
const LAYERS = [
  { y: 0, fill: "rgba(255,0,255,0.7)", duration: 7000 },
  { y: 3, fill: "rgba(255,0,255,0.5)", duration: 10000 },
  { y: 5, fill: "rgba(255,0,255,0.3)", duration: 13000 },
  { y: 7, fill: "rgb(255,0,255)", duration: 20000 },
] as const;

/**
 * Port of the web app's Wave: a pink fill that rises to `fillPercentage` of the
 * container, topped by a parallax wave crest.
 */
export function Wave({ fillPercentage }: { fillPercentage: number }) {
  const height = useSharedValue(0);

  useEffect(() => {
    // The web version resets to 0 then animates up, so the fill always reads
    // as filling rather than appearing.
    height.value = 0;
    const id = setTimeout(() => {
      height.value = withTiming(fillPercentage, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }, 100);
    return () => clearTimeout(id);
  }, [fillPercentage, height]);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${height.value}%`,
  }));

  return (
    <Animated.View style={[styles.fill, fillStyle]} pointerEvents="none">
      <View style={styles.crestBand}>
        {LAYERS.map((layer) => (
          <WaveLayer key={layer.y} {...layer} />
        ))}
      </View>
    </Animated.View>
  );
}

function WaveLayer({
  y,
  fill,
  duration,
}: {
  y: number;
  fill: string;
  duration: number;
}) {
  const { width } = useWindowDimensions();
  const shift = useSharedValue(-90);

  // Wider than the screen so the horizontal drift never exposes an edge.
  const svgWidth = width + 220;

  useEffect(() => {
    shift.value = withRepeat(
      withTiming(85, {
        duration,
        easing: Easing.bezier(0.55, 0.5, 0.45, 0.5),
      }),
      -1,
      true,
    );
  }, [duration, shift]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }],
  }));

  return (
    <Animated.View style={[styles.layer, { width: svgWidth }, style]}>
      <Svg
        width={svgWidth}
        height={CREST_HEIGHT}
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
      >
        <Path d={GENTLE_WAVE} fill={fill} translateX={48} translateY={y} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.pink,
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
  layer: {
    position: "absolute",
    bottom: -7,
    left: -110,
  },
});
