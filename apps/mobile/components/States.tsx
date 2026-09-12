import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Loader } from "@/components/Loader";
import { PillButton } from "@/components/PillButton";
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
  // A load that finishes inside this window shows only the background, never
  // the animation. Without it, a fast response put the loader on screen for a
  // few frames and read as a flash rather than as loading.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), LOADER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.screen}>{visible ? <Loader size={132} /> : null}</View>
  );
}

/** Long enough to swallow a cached or quick response, short enough to feel prompt. */
const LOADER_DELAY_MS = 250;

/**
 * What a failed load says. The raw error goes to the crash reporter, not the
 * screen: "fetch failed: UnexpectedException" means nothing to a person, and
 * "pull down to retry" did nothing on screens that cannot be pulled.
 */
export function ErrorState({
  message = "Check your connection and try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>Could not load</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? (
        <View style={styles.retry}>
          <PillButton label="RETRY" onPress={onRetry} />
        </View>
      ) : null}
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
  retry: { marginTop: space.sm, alignItems: "flex-start" },
});
