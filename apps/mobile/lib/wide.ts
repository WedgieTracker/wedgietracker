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
 * The space to leave at each side of the content. On a wide screen both sides
 * get the larger of the two safe-area insets, so the content is centred on
 * the screen: on the iPhone Duo's inner display the status bar and tab bar
 * take a column down the right edge, and matching it on the left puts the
 * middle of the content, where two columns meet, on the fold. On a phone the
 * insets are used as they are (both 0 in portrait).
 */
export function useSideInsets(): { left: number; right: number } {
  const { width: window } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const side = Math.max(left, right);
  return window - 2 * side >= WIDE_MIN
    ? { left: side, right: side }
    : { left, right };
}

/**
 * Whether there is room for two columns, and the width content can use: the
 * window less the side insets above.
 */
export function useWide() {
  const { width: window } = useWindowDimensions();
  const { left, right } = useSideInsets();
  const width = window - left - right;
  return { wide: width >= WIDE_MIN, width };
}
