import { StyleSheet, Text, View } from "react-native";

import { Loader } from "@/components/Loader";
import { colors, radius, space, type } from "@/lib/theme";

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <View style={styles.centered}>
      <Loader size={112} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

/**
 * A whole screen given over to the loader, used while a page's first data is
 * still arriving. Screens render this *instead of* their content rather than
 * above it, so nothing is half-drawn and nothing jumps when the data lands.
 */
export function ScreenLoading() {
  return (
    <View style={styles.screen}>
      <Loader size={132} />
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>Could not load</Text>
      <Text style={styles.muted}>{message}</Text>
      <Text style={styles.hint}>Pull down to retry.</Text>
    </View>
  );
}

export function Empty({ label }: { label: string }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.darkpurpleDark,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    // Reserve a stable block so replacing the loader with content does not
    // shift everything below it.
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
    gap: space.md,
  },
  muted: { ...type.body, color: colors.muted, textAlign: "center" },
  error: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.darkpurpleLight,
    borderWidth: 1,
    borderColor: colors.pink,
    gap: space.xs,
  },
  errorTitle: { ...type.label, color: colors.pink },
  hint: { ...type.label, color: colors.faint, marginTop: space.xs },
});
