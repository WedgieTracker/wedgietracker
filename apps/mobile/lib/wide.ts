import { useWindowDimensions } from "react-native";

/**
 * Wide enough for two columns: the iPhone Duo's inner display (about 669pt)
 * and anything wider. Every phone in portrait stays under it.
 */
export const WIDE_MIN = 600;

/** The usable width for content, capped so lines don't run too long. */
export const WIDE_MAX = 1000;

export function useWide() {
  const { width } = useWindowDimensions();
  return { wide: width >= WIDE_MIN, width };
}
