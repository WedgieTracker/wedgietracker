import { router } from "expo-router";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { CoffeeScoreboard } from "@/components/CoffeeScoreboard";
import { api } from "@/lib/api";

/**
 * The coffees scoreboard and its way into the support screen, closing every
 * screen as it does on Home. A failed load hides it rather than showing an
 * error at the foot of the page.
 */
export function SupportFooter({ style }: { style?: ViewStyle }) {
  const coffees = api.donations.getSeasonCoffees.useQuery(undefined, {
    retry: 1,
  });
  if (coffees.error) return null;
  return (
    <View style={[styles.wrap, style]}>
      <CoffeeScoreboard
        data={coffees.data ?? null}
        onSupport={() => router.push("/support")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32, width: "100%" },
});
