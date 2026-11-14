import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Wide enough for two columns: the iPhone Duo's inner display (about 669pt)
 * and anything wider. Every phone in portrait stays under it.
 */
export const WIDE_MIN = 600;

/** The usable width for content, capped so lines don't run too long. */
export const WIDE_MAX = 1000;

/**
 * Whether there is room for two columns, and the width content can use: the
 * window less the side safe areas. On the iPhone Duo's inner display the
 * status bar and tab bar take a column down the right edge, and sizing from
 * the whole window ran the right-hand column under it.
 */
export function useWide() {
  const { width: window } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const width = window - left - right;
  return { wide: width >= WIDE_MIN, width };
}
