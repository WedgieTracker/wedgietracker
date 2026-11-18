import type { ComponentRef, RefObject } from "react";
import { StyleSheet, Text, View, type RefreshControlProps } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { TopSafeArea } from "@/components/TopSafeArea";
import { useTabBarClearance } from "@/lib/layout";
import { useShotScroll } from "@/lib/screenshot";
import { colors, space, type } from "@/lib/theme";
import { useSideInsets } from "@/lib/wide";

interface ScreenProps {
  heading: React.ReactNode;
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** A stack screen whose navigation header already clears the status bar. */
  underHeader?: boolean;
  /** Follows the scroll position, for anything pinned while scrolling. */
  scrollY?: SharedValue<number>;
  /** The view holding the content, for measuring places within it. */
  contentRef?: RefObject<ComponentRef<typeof View> | null>;
}

export function Screen({
  heading,
  children,
  refreshControl,
  underHeader = false,
  scrollY,
  contentRef,
}: ScreenProps) {
  const tabBar = useTabBarClearance();
  // A pushed screen sits under the native header, outside TopSafeArea, so it
  // pads its own sides: on the opened Duo the status bar and back button sit
  // in a column down the right edge, and the content would run under them.
  const sides = useSideInsets();
  const shotRef = useAnimatedRef<Animated.ScrollView>();
  useShotScroll(shotRef);
  const fallback = useSharedValue(0);
  const offset = scrollY ?? fallback;
  const onScroll = useAnimatedScrollHandler((e) => {
    offset.value = e.contentOffset.y;
  });

  const scroll = (
    <Animated.ScrollView
      ref={shotRef}
      contentContainerStyle={[styles.content, { paddingBottom: tabBar }]}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View ref={contentRef}>
        {heading}
        {children}
      </View>
    </Animated.ScrollView>
  );

  return underHeader ? (
    <View
      style={[
        styles.safe,
        { paddingLeft: sides.left, paddingRight: sides.right },
      ]}
    >
      {scroll}
    </View>
  ) : (
    <TopSafeArea style={styles.safe}>{scroll}</TopSafeArea>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  // The site's pages sit on night.
  safe: { flex: 1, backgroundColor: colors.night },
  // Capped and centred on a wide screen, like the iPhone Duo opened up.
  content: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    padding: space.lg,
  },
  sectionLabel: {
    ...type.section,
    color: colors.cream,
    marginTop: space.xl,
    marginBottom: space.md,
  },
});
