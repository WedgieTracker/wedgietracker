import { StyleSheet, Text, View } from "react-native";

import { GradientFill } from "@/components/Gradient";
import { badgeTextShadow, colors, fonts } from "@/lib/theme";

const CHIP_TEXT = 22;

/**
 * Port of apps/web/src/components/shared/PageHeading.tsx: a page title in
 * sentence case, with an optional figure beside it in a small badge-gradient
 * chip. `badgeAction` sits on the chip's corner, out of the flow, so showing
 * it never moves the heading.
 */
export function PageHeading({
  title,
  badge,
  badgeAction,
}: {
  title: string;
  badge?: React.ReactNode;
  badgeAction?: React.ReactNode;
}) {
  return (
    <View style={styles.heading}>
      <Text
        style={styles.title}
        allowFontScaling={false}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {badge !== undefined && badge !== null ? (
        <View style={styles.chip}>
          <GradientFill name="button" radius={12} />
          {badge}
          {badgeAction}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The chip's figure, set over an invisible copy of the widest value it can
 * show, so the chip never changes width as the figure changes.
 */
export function ChipNumber({
  value,
  widest,
}: {
  value: string;
  widest: string;
}) {
  return (
    <View>
      <Text
        style={[styles.chipText, styles.invisible]}
        allowFontScaling={false}
      >
        {widest}
      </Text>
      <Text
        style={[styles.chipText, styles.chipValue, badgeTextShadow(CHIP_TEXT)]}
        allowFontScaling={false}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  // `text-[34px] leading-none font-black tracking-[-0.03em]`
  title: {
    fontFamily: fonts.black,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    color: colors.cream,
  },
  // `bg-button rounded-xl px-2.5 py-1`
  chip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: fonts.blackItalic,
    fontSize: CHIP_TEXT,
    lineHeight: CHIP_TEXT + 4,
    color: colors.cream,
    fontVariant: ["tabular-nums"],
  },
  invisible: { opacity: 0 },
  chipValue: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
});
