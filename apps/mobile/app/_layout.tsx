import * as Sentry from "@sentry/react-native";
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

import { initSentry, report, useScreenTracking } from "@/lib/observability";
import { ApiProvider } from "@/lib/provider";
import { colors, fonts } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Before the first render, so a crash during startup is still reported.
initSentry();

void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  // The site is set in Inter; the heavy weights carry most of its character.
  const [loaded, error] = useFonts({
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useScreenTracking();

  useEffect(() => {
    // A font that fails to load leaves the app legible but off-brand, which is
    // the kind of fault nobody reports and nobody would otherwise see.
    if (error) report("fonts.load", error);
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
            // A fixed detent rather than "fitToContents": the latter silently
            // turns off the system dimming behind the sheet, and a clear
            // backdrop matters more here than shrink-wrapping the content.
            // The content scrolls, so a slight over- or under-shoot is safe.
            sheetAllowedDetents: [0.78],
            sheetCornerRadius: 24,
            sheetGrabberVisible: true,
            // No detent is left undimmed, so the page behind is always dimmed.
            sheetLargestUndimmedDetentIndex: "none",
          }}
        />
      </Stack>
    </ApiProvider>
  );
}

// Sentry.wrap adds the native error boundary and app-start context. It has to
// be the default export, so the wrapper is what expo-router renders.
export default Sentry.wrap(RootLayout);
