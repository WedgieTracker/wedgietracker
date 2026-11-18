import { useState, type ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { FluidWidth } from "@/lib/fluid";
import { useWide } from "@/lib/wide";

/** Space kept above the pinned column while it follows the scroll. */
const STICKY_TOP = 12;

/**
 * Two columns for a wide screen, where the left one stays in view while the
 * right one scrolls past it, as `sticky` does on the website's desktop
 * layout. Pass the parent scroll view's `scrollY` (an Animated.Value driven by
 * its onScroll).
 *
 * The columns are equal, and the content is centred on the screen, so on the
 * iPhone Duo the fold runs down the gap between them. `inset` is its parent's
 * padding on each side, and `gap` the space between the columns.
 */
export function StickySplit({
  scrollY,
  left,
  right,
  inset = 0,
  gap = 0,
}: {
  scrollY: Animated.Value;
  left: ReactNode;
  right: ReactNode;
  inset?: number;
  gap?: number;
}) {
  // Content is centred on the screen (see useSideInsets), so two equal
  // columns meet in the middle of it, on the Duo's fold.
  const { width } = useWide();
  const leftWidth = Math.max(0, (width - 2 * inset - gap) / 2);

  const [top, setTop] = useState(0);
  const [leftHeight, setLeftHeight] = useState(0);
  const [rightHeight, setRightHeight] = useState(0);
  const travel = Math.max(0, rightHeight - leftHeight);

  // Starts following once the column's top reaches the top of the screen and
  // stops when its foot meets the foot of the right-hand column.
  const start = top - STICKY_TOP;
  const translateY =
    travel > 0
      ? scrollY.interpolate({
          inputRange: [start, start + travel],
          outputRange: [0, travel],
          extrapolate: "clamp",
        })
      : 0;

  return (
    <View
      style={[styles.split, { gap }]}
      onLayout={(e) => setTop(e.nativeEvent.layout.y)}
    >
      <Animated.View
        style={{ width: leftWidth, transform: [{ translateY }] }}
        onLayout={(e) => setLeftHeight(e.nativeEvent.layout.height)}
      >
        {/* Sized as on a phone as wide as this column. */}
        <FluidWidth.Provider value={leftWidth}>{left}</FluidWidth.Provider>
      </Animated.View>
      <View
        style={styles.right}
        onLayout={(e) => setRightHeight(e.nativeEvent.layout.height)}
      >
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  split: { flexDirection: "row", alignItems: "flex-start" },
  right: { flex: 1 },
});
