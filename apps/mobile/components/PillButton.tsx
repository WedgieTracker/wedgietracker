import { Pressable, StyleSheet, Text } from "react-native";

import { useFluidType } from "@/lib/fluid";
import { colors, fonts, radius, space } from "@/lib/theme";

/**
 * The site's yellow call-to-action. `variant="bar"` is the full-width footer
 * attached to the bottom of a card (WATCH THEM ALL / SEE STANDINGS);
 * `variant="pill"` is the free-standing rounded button (MORE STATS).
 */
export function PillButton({
  label,
  onPress,
  variant = "pill",
}: {
  label: string;
  onPress: () => void;
  variant?: "pill" | "bar";
}) {
  const t = useFluidType();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "pill" ? styles.pill : styles.bar,
        pressed && styles.pressed,
      ]}
    >
      {({ pressed }) => (
        <Text
          style={[
            styles.label,
            { fontSize: t.buttonText },
            pressed && styles.labelPressed,
          ]}
          allowFontScaling={false}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    paddingVertical: 5,
    minWidth: 192,
  },
  bar: {
    width: "100%",
    paddingVertical: space.sm,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  // The web buttons invert to a transparent fill with yellow text.
  pressed: { backgroundColor: "transparent" },
  label: { fontFamily: fonts.black, color: colors.darkpurple },
  labelPressed: { color: colors.yellow },
});
