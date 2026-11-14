import { StyleSheet, Text, View, type RefreshControlProps } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { TopSafeArea } from "@/components/TopSafeArea";
import { useTabBarClearance } from "@/lib/layout";
import { colors, space, type } from "@/lib/theme";

interface ScreenProps {
  heading: React.ReactNode;
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** A stack screen whose navigation header already clears the status bar. */
  underHeader?: boolean;
  /** Follows the scroll position, for anything pinned while scrolling. */
  scrollY?: SharedValue<number>;
}

export function Screen({
  heading,
  children,
  refreshControl,
  underHeader = false,
  scrollY,
}: ScreenProps) {
  const tabBar = useTabBarClearance();
  const fallback = useSharedValue(0);
  const offset = scrollY ?? fallback;
  const onScroll = useAnimatedScrollHandler((e) => {
    offset.value = e.contentOffset.y;
  });

  const scroll = (
    <Animated.ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: tabBar }]}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {heading}
      {children}
    </Animated.ScrollView>
  );

  return underHeader ? (
    <View style={styles.safe}>{scroll}</View>
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
    color: colors.yellow,
    marginTop: space.xl,
    marginBottom: space.md,
  },
});
