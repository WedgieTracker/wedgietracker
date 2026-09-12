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
          name="seasons"
          options={{ title: "SEASONS HISTORY", headerBackTitle: "Stats" }}
        />
        {/*
          A sheet sized to its content rather than a full-height modal, and no
          header: the title said nothing the screen does not already show.
        */}
        <Stack.Screen
          name="wedgie/[id]"
          options={{
            presentation: "formSheet",
            headerShown: false,
            sheetAllowedDetents: "fitToContents",
            sheetCornerRadius: 24,
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </ApiProvider>
  );
}
