import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * How much room a scrolling tab screen must leave at its foot so the last of
 * its content clears the tab bar.
 *
 * On iOS 26 the tab bar is a floating Liquid Glass capsule that content passes
 * beneath, and expo-router's native tabs expose no height for it - nor does
 * `contentInsetAdjustmentBehavior` reach these scroll views. Measured at 83pt
 * from the bottom of an iPhone 17: the safe-area inset plus the bar itself,
 * which is where the 56 comes from.
 */
export function useTabBarClearance(): number {
  const { bottom } = useSafeAreaInsets();
  return bottom + 56;
}
