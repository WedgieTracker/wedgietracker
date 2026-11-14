import { useId } from "react";
import { Image, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { gradients, type GradientName } from "@/lib/theme";

/**
 * The start and end of a CSS `linear-gradient(<angle>deg, ...)` in the box's
 * own 0 to 1 space: 0deg runs bottom to top, 90deg left to right.
 */
function cssAngle(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = -Math.cos(rad) / 2;
  return { x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy };
}

/**
 * One of the palette's gradients filling its parent, behind the content.
 * React Native has no CSS gradients, and react-native-svg is already in the
 * app, so a stretched SVG rect paints it.
 */
export function GradientFill({
  name,
  radius = 0,
  style,
}: {
  name: GradientName;
  radius?: number;
  style?: ViewStyle;
}) {
  // Colons from useId are not safe inside url(#...) references.
  const id = `g${useId().replace(/:/g, "")}`;
  const { angle, stops } = gradients[name];
  const line = cssAngle(angle);

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius }, style]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} {...line}>
            {stops.map(([offset, color]) => (
              <Stop key={offset} offset={offset} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          rx={radius}
          ry={radius}
          fill={`url(#${id})`}
        />
      </Svg>
    </View>
  );
}

/**
 * Film grain over a gradient, like the badge (`grain` on the web). The web
 * draws it with an SVG turbulence filter, which react-native-svg cannot, so
 * it is a tiled noise image blended the same way.
 */
export function Grain({ radius = 0 }: { radius?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.grain, { borderRadius: radius }]}
    >
      <Image
        source={require("../assets/images/grain.png")}
        resizeMode="repeat"
        style={styles.grainImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grain: { overflow: "hidden", opacity: 0.24, mixBlendMode: "soft-light" },
  grainImage: { width: "100%", height: "100%" },
});
