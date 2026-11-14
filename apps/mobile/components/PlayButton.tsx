import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { GradientFill } from "@/components/Gradient";

/**
 * The gradient play button on wedgie cards (PlayIcon.tsx on the web): a glow
 * circle with a rounded cream triangle, nudged right so it looks centred.
 */
export function PlayButton({ size = "sm" }: { size?: "sm" | "lg" }) {
  const box = size === "lg" ? 40 : 30;
  const icon = size === "lg" ? 16 : 13;

  return (
    <View
      style={[
        styles.button,
        { width: box, height: box, borderRadius: box / 2 },
      ]}
    >
      <GradientFill name="glow" radius={box / 2} />
      <View style={[styles.icon, { marginLeft: icon * 0.1 }]}>
        <Svg width={icon} height={icon} viewBox="0 0 24 24">
          <Path
            d="M7 4.5v15l13-7.5z"
            fill="#fff6de"
            stroke="#fff6de"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    // A solid colour under the gradient lets iOS draw the shadow cheaply.
    backgroundColor: "#7b6bf0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7a5ff0",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  // `drop-shadow-[0_1px_1.5px_rgb(30_12_80/0.55)]`
  icon: {
    shadowColor: "#1e0c50",
    shadowOpacity: 0.55,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
});
