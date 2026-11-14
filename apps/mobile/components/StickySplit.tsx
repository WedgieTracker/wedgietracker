import { useState, type ReactNode } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FluidWidth } from "@/lib/fluid";

/** Space kept above the pinned column while it follows the scroll. */
const STICKY_TOP = 12;

/**
 * Two columns for a wide screen, where the left one stays in view while the
 * right one scrolls past it, as `sticky` does on the website's desktop
 * layout. Pass the parent scroll view's `scrollY` (an Animated.Value driven by
 * its onScroll).
 *
 * The columns meet at the middle of the screen rather than the middle of the
 * content area, so on the iPhone Duo the fold runs down the gutter between
 * them instead of through the right-hand column. `inset` is how far the split
 * sits from the safe area's left edge (its parent's padding), and `gap` the
 * space between the columns.
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
  const { width: window } = useWindowDimensions();
  const safe = useSafeAreaInsets();
  const leftWidth = Math.max(0, window / 2 - safe.left - inset - gap / 2);

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
