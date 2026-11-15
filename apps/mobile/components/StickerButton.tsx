import {
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useFluidType } from "@/lib/fluid";
import { colors, fonts } from "@/lib/theme";

const OFFSET = 6;
const SMALL_OFFSET = 3;

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
  small = false,
  disabled = false,
  icon,
  labelStyle,
  style,
}: {
  label: string;
  /** Drawn before the label, as the web's Support button has its cup. */
  icon?: React.ReactNode;
  labelStyle?: TextStyle;
  onPress: () => void;
  variant?: "violet" | "dark" | "flat";
  /** The smaller one that straddles the hero (MORE STATS). */
  compact?: boolean;
  /** `btn-sticker-sm`: a short one for links inside cards. */
  small?: boolean;
  disabled?: boolean;
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
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        small ? styles.small : compact ? styles.compact : styles.full,
        { shadowColor },
        pressed &&
          variant !== "flat" &&
          (small ? styles.pressedSmall : styles.pressed),
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          { fontSize: small ? 13 : t.buttonText },
          labelStyle,
        ]}
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
  small: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 10,
    shadowOffset: { width: SMALL_OFFSET, height: SMALL_OFFSET },
  },
  // Pressed flat into its shadow.
  pressed: {
    transform: [{ translateX: OFFSET }, { translateY: OFFSET }],
    shadowOffset: { width: 0, height: 0 },
  },
  pressedSmall: {
    transform: [{ translateX: SMALL_OFFSET }, { translateY: SMALL_OFFSET }],
    shadowOffset: { width: 0, height: 0 },
  },
  label: { fontFamily: fonts.black, color: colors.ink },
});
