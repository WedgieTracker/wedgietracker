import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { ApiProvider } from "@/lib/provider";
import { colors } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  return (
    <ApiProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.darkpurple },
          headerTintColor: colors.yellow,
          headerTitleStyle: { fontWeight: "900" },
          contentStyle: { backgroundColor: colors.darkpurple },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="wedgie/[id]"
          options={{ title: "Wedgie", presentation: "modal" }}
        />
      </Stack>
    </ApiProvider>
  );
}
