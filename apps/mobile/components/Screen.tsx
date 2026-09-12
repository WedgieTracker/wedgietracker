import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type RefreshControlProps,
} from "react-native";

import { TopSafeArea } from "@/components/TopSafeArea";
import { useTabBarClearance } from "@/lib/layout";
import { colors, space, type } from "@/lib/theme";

interface ScreenProps {
  heading: React.ReactNode;
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** A stack screen whose navigation header already clears the status bar. */
  underHeader?: boolean;
}

export function Screen({
  heading,
  children,
  refreshControl,
  underHeader = false,
}: ScreenProps) {
  const tabBar = useTabBarClearance();

  const scroll = (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: tabBar }]}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {heading}
      {children}
    </ScrollView>
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
  // The site's inner pages sit on the darker column colour.
  safe: { flex: 1, backgroundColor: colors.darkpurpleDark },
  content: { padding: space.lg },
  sectionLabel: {
    ...type.section,
    color: colors.yellow,
    marginTop: space.xl,
    marginBottom: space.md,
  },
});
