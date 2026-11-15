import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

const LIQUID = isLiquidGlassAvailable();

/**
 * iOS's own Liquid Glass (UIGlassEffect, through expo-glass-effect) for the
 * app's floating controls, as the system tab bar already has. Before iOS 26
 * it falls back to a translucent fill with a hairline edge.
 */
export function Glass({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  if (LIQUID) {
    return (
      <GlassView
        style={style}
        glassEffectStyle="regular"
        colorScheme="dark"
        isInteractive
      >
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.fallback, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
});
