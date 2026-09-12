import { StyleSheet, View } from "react-native";
import { SvgUri } from "react-native-svg";

import { colors } from "@/lib/theme";

/** Same asset the web app uses. */
const COURT_SVG =
  "https://res.cloudinary.com/wedgietracker/image/upload/v1735557904/assets/court_aazejm.svg";

/** The web diagram reserves 73.3% of its width as height. */
const COURT_ASPECT = 1 / 0.733;

/**
 * Port of apps/web/src/components/home/CourtPositionDiagram.tsx: the court
 * outline with a yellow dot at the wedgie's recorded position.
 */
export function CourtPositionDiagram({
  position,
  width,
  dotSize = 10,
}: {
  position: { x: number; y: number };
  width: number;
  dotSize?: number;
}) {
  const height = width / COURT_ASPECT;

  return (
    <View style={{ width, height }}>
      <SvgUri width={width} height={height} uri={COURT_SVG} />
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            left: (position.x / 100) * width - dotSize / 2,
            top: (position.y / 100) * height - dotSize / 2,
          },
        ]}
      >
        <View
          style={[
            styles.dotInner,
            {
              width: dotSize - 3,
              height: dotSize - 3,
              borderRadius: (dotSize - 3) / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: {
    backgroundColor: colors.yellow,
    borderWidth: 1,
    borderColor: colors.darkpurple,
  },
});
