import {
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { ApiProvider } from "@/lib/provider";
import { colors, fonts } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // The site is set in Inter; the heavy weights carry most of its character.
  const [loaded, error] = useFonts({
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ApiProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.darkpurple },
          headerTintColor: colors.yellow,
          headerTitleStyle: { fontFamily: fonts.black },
          contentStyle: { backgroundColor: colors.darkpurple },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="all-wedgies"
          options={{ title: "ALL WEDGIES", headerBackTitle: "Home" }}
        />
        <Stack.Screen
          name="wedgie/[id]"
          options={{ title: "WEDGIE", presentation: "modal" }}
        />
      </Stack>
    </ApiProvider>
  );
}
