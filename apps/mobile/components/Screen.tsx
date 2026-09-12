import {
  ScrollView,
  StyleSheet,
  Text,
  type RefreshControlProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space, type } from "@/lib/theme";

interface ScreenProps {
  heading: React.ReactNode;
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function Screen({ heading, children, refreshControl }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {heading}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  // The site's inner pages sit on the darker column colour.
  safe: { flex: 1, backgroundColor: colors.darkpurpleDark },
  content: { padding: space.lg, paddingBottom: space.xxl * 2 },
  sectionLabel: {
    ...type.section,
    color: colors.yellow,
    marginTop: space.xl,
    marginBottom: space.md,
  },
});
