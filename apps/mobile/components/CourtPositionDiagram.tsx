import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/lib/theme";

/**
 * The court outline, inlined rather than fetched.
 *
 * It used to come from Cloudinary through `SvgUri`, which meant a network
 * request for an unchanging 1.7 KB asset on every row of a 635 row list, and
 * an empty box whenever that request was slow or offline. The five paths are
 * the same artwork the web app uses.
 */
const COURT_VIEWBOX = "0 0 1023.9248 751.14307";

const COURT_PATHS = [
  "M491.59476,522.51978l1.591-7.55518a121.08956,121.08956,0,0,1-41.27444-17.01611l-4.21116,6.47317A128.8079,128.8079,0,0,0,491.59476,522.51978Z",
  "M623.929,469.69574a118.08679,118.08679,0,0,0,17.772-44.10013l-7.5929-1.39493a110.443,110.443,0,0,1-16.61834,41.2349Z",
  "M542.96729,523.06262a126.63653,126.63653,0,0,0,44.17175-17.444l-4.132-6.52218a118.91431,118.91431,0,0,1-41.48749,16.38085Z",
  "M411.17969,468.2518l6.43924-4.26016a112.9939,112.9939,0,0,1-16.87848-41.16895l-7.58158,1.459A120.65368,120.65368,0,0,0,411.17969,468.2518Z",
  "M164.0005,391.324c-55.03511,93.6574-66.84291,188.63815-66.956,189.58627L97.01807,751.143H926.90674V579.38147l-.03015-.23566c-.11689-.94439-12.40534-95.53869-71.09925-188.79461-54.26977-86.22855-160.355-189.017-357.55288-189.017C314.25943,201.33424,214.93193,304.65244,164.0005,391.324ZM360.65543,743.422V406.83585H672.82837V743.422ZM849.093,394.2269c56.479,89.614,69.39709,180.47409,70.09265,185.64664V743.422H680.54938V399.11478H643.454a120.04956,120.04956,0,0,0-24.88226-68.368,129.44106,129.44106,0,0,0-176.66431-26.6222c-27.08023,19.27814-44.675,47.69489-49.544,80.01551a119.21152,119.21152,0,0,0-1.20782,14.97464H352.93439V743.42194H104.73913V581.60767c.65411-5.09333,13.02363-96.46988,66.04743-186.591C220.7001,310.18121,318.0257,209.05531,498.2244,209.05531,691.76532,209.05531,795.85437,309.7533,849.093,394.2269ZM398.8493,399.11475A112.3861,112.3861,0,0,1,399.99777,385.29c4.55609-30.232,21.02933-56.82218,46.38663-74.87692a121.71965,121.71965,0,0,1,166.05347,25.0256,112.43208,112.43208,0,0,1,23.3078,63.67612Z",
];

/** The artwork's own proportions, 1023.9 by 751.1. */
const COURT_ASPECT = 1023.9248 / 751.14307;

/**
 * Port of apps/web/src/components/home/CourtPositionDiagram.tsx: the court
 * lines in cream, with the shot as a pink ripple, a glowing dot with two
 * fading rings, at the wedgie's recorded position.
 */
export function CourtPositionDiagram({
  position,
  width,
  dotSize = 10,
  lineColor = colors.cream80,
}: {
  position: { x: number; y: number };
  width: number;
  dotSize?: number;
  lineColor?: string;
}) {
  const height = width / COURT_ASPECT;
  const left = (position.x / 100) * width;
  const top = (position.y / 100) * height;
  // `-inset-[60%]` and `-inset-[130%]` on the web: rings 2.2x and 3.6x the dot.
  const inner = dotSize * 2.2;
  const outer = dotSize * 3.6;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={COURT_VIEWBOX}>
        {COURT_PATHS.map((d) => (
          <Path key={d} d={d} fill={lineColor} />
        ))}
      </Svg>
      <View
        style={[
          styles.ring,
          styles.outer,
          { width: outer, height: outer, borderRadius: outer / 2 },
          { left: left - outer / 2, top: top - outer / 2 },
        ]}
      />
      <View
        style={[
          styles.ring,
          styles.inner,
          { width: inner, height: inner, borderRadius: inner / 2 },
          { left: left - inner / 2, top: top - inner / 2 },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            left: left - dotSize / 2,
            top: top - dotSize / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    backgroundColor: colors.shot,
    shadowColor: colors.shot,
    shadowOpacity: 1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  ring: { position: "absolute", borderColor: colors.shot },
  inner: { borderWidth: 2, opacity: 0.7 },
  outer: { borderWidth: 1.5, opacity: 0.35 },
});
