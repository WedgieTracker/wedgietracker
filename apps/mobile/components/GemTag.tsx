import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { GradientFill } from "@/components/Gradient";
import { colors, fonts } from "@/lib/theme";

/**
 * Port of apps/web/src/components/shared/GemTag.tsx: a small gem-gradient
 * "GEM" tag where the date would go, since GEMS have no real date.
 */
export function GemTag() {
  return (
    <View
      style={styles.tag}
      accessible
      accessibilityLabel="GEM, not part of a season"
    >
      <GradientFill name="gem" radius={6} />
      <Svg width={9} height={9} viewBox="0 0 12 12">
        <Path d="M3 1.5h6L11 4.5 6 10.5 1 4.5z" fill={colors.night} />
        <Path
          d="M1 4.5h10M4.2 1.5 6 4.5l1.8-3M6 4.5v6"
          stroke="rgba(240, 225, 182, 0.45)"
          strokeWidth={0.7}
          fill="none"
        />
      </Svg>
      <Text style={styles.text} allowFontScaling={false}>
        GEM
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // `rounded-md py-0.5 pr-1.5 pl-1 text-[10px] font-black tracking-[0.06em]`
  tag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingLeft: 4,
    paddingRight: 6,
    borderRadius: 6,
  },
  text: {
    fontFamily: fonts.black,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: colors.night,
  },
});
