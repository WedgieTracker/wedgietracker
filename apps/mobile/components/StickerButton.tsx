import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { useFluidType } from "@/lib/fluid";
import { colors, fonts } from "@/lib/theme";

const OFFSET = 6;

/**
 * The site's section button (`btn-sticker` in globals.css): a cream sticker
 * with a dark ink border on a hard violet shadow, pressing flat into the
 * shadow on tap. `flat` drops the shadow where it would fight the background,
 * `dark` gives it a night shadow that still shows on the gradient.
 */
export function StickerButton({
  label,
  onPress,
  variant = "violet",
  compact = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "violet" | "dark" | "flat";
  /** The smaller one that straddles the hero (MORE STATS). */
  compact?: boolean;
  style?: ViewStyle;
}) {
  const t = useFluidType();
  const shadowColor =
    variant === "dark"
      ? colors.night
      : variant === "flat"
        ? "transparent"
        : colors.violet;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.full,
        { shadowColor },
        pressed && variant !== "flat" && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[styles.label, { fontSize: t.buttonText }]}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 16,
    backgroundColor: colors.cream,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: OFFSET, height: OFFSET },
  },
  full: { alignSelf: "stretch", minHeight: 54, paddingHorizontal: 24 },
  // `min-h-12 min-w-48 px-8`
  compact: { minHeight: 48, minWidth: 192, paddingHorizontal: 32 },
  // Pressed flat into its shadow.
  pressed: {
    transform: [{ translateX: OFFSET }, { translateY: OFFSET }],
    shadowOffset: { width: 0, height: 0 },
  },
  label: { fontFamily: fonts.black, color: colors.ink },
});
