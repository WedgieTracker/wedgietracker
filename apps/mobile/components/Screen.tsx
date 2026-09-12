import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type RefreshControlProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space, type } from "@/lib/theme";

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function Screen({
  title,
  subtitle,
  children,
  refreshControl,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
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
  header: { marginBottom: space.xl },
  title: { ...type.title, color: colors.yellow },
  subtitle: { ...type.body, color: colors.muted, marginTop: space.xs },
  sectionLabel: {
    ...type.section,
    color: colors.yellow,
    marginTop: space.xl,
    marginBottom: space.md,
  },
});
