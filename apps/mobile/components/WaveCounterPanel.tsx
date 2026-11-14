import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";

import { Confetti } from "@/components/Confetti";
import { useCountUp } from "@/components/Counter";
import { GradientFill, Grain } from "@/components/Gradient";
import { Wave } from "@/components/Wave";
import { clampRem, useFluidType } from "@/lib/fluid";
import { badgeTextShadow, colors, fonts, space } from "@/lib/theme";

/**
 * The badge hero shared by the home screen and the stats page
 * (apps/web/src/components/home/Stats.tsx and StatsSkeleton.tsx): the grainy
 * badge gradient, the wave rising toward 50, and the running total.
 *
 * `value` is null while the stats load: the panel keeps its size and only the
 * number is left out, so nothing moves when it arrives.
 */
export function WaveCounterPanel({
  value,
  previousRecord,
  minHeight = 400,
  style,
}: {
  value: number | null;
  previousRecord: number;
  minHeight?: number;
  style?: ViewStyle;
}) {
  const { width } = useWindowDimensions();
  const t = useFluidType();
  const [box, setBox] = useState({ width: 0, height: 0 });

  // Both pages fill toward the same 50-wedgie target.
  const fillPercentage = value === null ? 0 : Math.min((value / 50) * 100, 100);
  const shown = useCountUp(value ?? 0);

  const headline =
    value === null || value < previousRecord
      ? "WE'RE AT"
      : value > previousRecord
        ? "NEW ALL-TIME RECORD"
        : "ALL-TIME RECORD TIED";

  return (
    <View
      style={[styles.panel, { minHeight }, style]}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
    >
      <GradientFill name="badge" />
      <Grain />
      <Wave fillPercentage={fillPercentage} containerHeight={box.height} />

      <View style={[styles.card, { width: clampRem(16, 13, 16, 28, width) }]}>
        <Text style={styles.headline} allowFontScaling={false}>
          {headline}
        </Text>
        <Text
          style={[
            styles.bigNumber,
            {
              fontSize: t.bigNumber,
              lineHeight: t.bigNumber * 0.88,
              paddingTop: t.bigNumber * 0.12,
            },
            badgeTextShadow(t.bigNumber),
            value === null && styles.hidden,
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {value === null ? "0" : shown.toLocaleString()}
        </Text>
        <Text
          style={[
            styles.label,
            {
              fontSize: t.wedgiesText,
              lineHeight: t.wedgiesText,
              marginTop: t.wedgiesText * 0.08,
            },
            badgeTextShadow(t.wedgiesText),
          ]}
          allowFontScaling={false}
        >
          WEDGIES
        </Text>
      </View>

      {/*
        The web celebrates once the wave tops out. Here the confetti sits in
        front of the card, because pieces showing through the translucent card
        read as smudges on the number rather than as confetti.
      */}
      {fillPercentage >= 100 ? (
        <Confetti width={box.width} height={box.height} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  // `bg-panel/50 rounded-lg p-4`
  card: {
    backgroundColor: "rgba(29, 18, 66, 0.5)",
    borderRadius: 8,
    padding: space.lg,
    alignItems: "center",
  },
  headline: {
    fontFamily: fonts.bold,
    color: colors.cream,
    fontSize: 14,
    lineHeight: 14,
    marginBottom: 2,
  },
  bigNumber: {
    fontFamily: fonts.black,
    color: colors.cream,
    includeFontPadding: false,
  },
  hidden: { opacity: 0 },
  label: { fontFamily: fonts.black, color: colors.cream },
});
