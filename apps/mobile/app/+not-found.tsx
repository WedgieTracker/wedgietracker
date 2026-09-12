import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, space, type } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          Back to the feed
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    backgroundColor: colors.darkpurple,
    gap: space.lg,
  },
  title: {
    ...type.title,
    fontSize: 20,
    color: colors.white,
    textAlign: "center",
  },
  link: { ...type.body, color: colors.yellow, fontWeight: "800" },
});
