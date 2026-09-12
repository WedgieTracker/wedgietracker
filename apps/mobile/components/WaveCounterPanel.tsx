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
import { Wave } from "@/components/Wave";
import { clampRem, useFluidType } from "@/lib/fluid";
import { colors, fonts, radius, space } from "@/lib/theme";

/**
 * The wave-filled counter shared by the home hero and the stats page
 * (apps/web/src/components/home/Stats.tsx and
 * .../stats-for-nerds/StatsForNerds.tsx render the same block).
 */
export function WaveCounterPanel({
  value,
  previousRecord,
  minHeight = 400,
  style,
}: {
  value: number;
  previousRecord: number;
  minHeight?: number;
  style?: ViewStyle;
}) {
  const { width } = useWindowDimensions();
  const t = useFluidType();
  const [box, setBox] = useState({ width: 0, height: 0 });

  // Both pages fill toward the same 50-wedgie target.
  const fillPercentage = Math.min((value / 50) * 100, 100);
  const shown = useCountUp(value);

  const headline =
    value > previousRecord
      ? "NEW ALL-TIME RECORD"
      : value === previousRecord
        ? "ALL-TIME RECORD TIED"
        : "WE'RE AT";

  return (
    <View
      style={[styles.panel, { minHeight }, style]}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
    >
      <Wave fillPercentage={fillPercentage} />

      {/* The web celebrates once the wave tops out. */}
      {fillPercentage >= 100 ? (
        <Confetti width={box.width} height={box.height} />
      ) : null}

      <View style={[styles.card, { width: clampRem(16, 13, 16, 28, width) }]}>
        <Text style={styles.headline} allowFontScaling={false}>
          {headline}
        </Text>
        <Text
          style={[styles.bigNumber, { fontSize: t.bigNumber }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {shown.toLocaleString()}
        </Text>
        <Text
          style={[styles.label, { fontSize: t.wedgiesText }]}
          allowFontScaling={false}
        >
          WEDGIES
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.darkpurpleLight,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
  },
  card: {
    backgroundColor: "rgba(31, 0, 77, 0.5)",
    borderRadius: radius.md,
    padding: space.lg,
    alignItems: "center",
  },
  headline: { fontFamily: fonts.bold, color: colors.yellow, fontSize: 14 },
  bigNumber: {
    fontFamily: fonts.black,
    color: colors.yellow,
    includeFontPadding: false,
  },
  label: { fontFamily: fonts.black, color: colors.yellow },
});
