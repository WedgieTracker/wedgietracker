import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, space } from "@/lib/theme";

/**
 * The site's page headings: two stacked lines, yellow over pink, the lower one
 * scaled and pulled up so it overlaps - the same device as the wordmark.
 *
 * Each page picks its own base size and scale, taken from the `<h1>` in its
 * matching page under apps/web/src/app, because the line lengths differ too
 * much for one ratio to serve them all.
 */
export function PageHeading({
  top,
  bottom,
  base,
  bottomScale,
  liftEm,
}: {
  top: string;
  bottom: string;
  /** The `text-*` size on the web's h1, in px. */
  base: number;
  /** The lower line's `text-[Xem]`. */
  bottomScale: number;
  /** The lower line's `mt-[-Xem]`, relative to its own size. */
  liftEm: number;
}) {
  const bottomSize = base * bottomScale;

  return (
    <View style={styles.heading}>
      <Text
        style={[styles.line, { fontSize: base, lineHeight: base }]}
        allowFontScaling={false}
      >
        {top.toUpperCase()}
      </Text>
      <Text
        style={[
          styles.line,
          styles.bottom,
          {
            fontSize: bottomSize,
            lineHeight: bottomSize,
            marginTop: -liftEm * bottomSize,
          },
        ]}
        allowFontScaling={false}
      >
        {bottom.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { alignItems: "center", marginBottom: space.xl },
  line: {
    fontFamily: fonts.black,
    color: colors.yellow,
    textAlign: "center",
  },
  // Sits behind the yellow line, as `z-0` does on the web.
  bottom: { color: colors.pink, zIndex: -1 },
});
