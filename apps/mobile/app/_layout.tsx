import * as Sentry from "@sentry/react-native";
import {
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  Inter_900Black_Italic,
  useFonts,
} from "@expo-google-fonts/inter";
import { PermanentMarker_400Regular } from "@expo-google-fonts/permanent-marker";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";
import "react-native-reanimated";

import { initSentry, report, useScreenTracking } from "@/lib/observability";
import { ApiProvider } from "@/lib/provider";
import { colors, fonts } from "@/lib/theme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Before the first render, so a crash during startup is still reported.
initSentry();

// Development only: iOS layout advice about shadows on gradient-backed views,
// which draw the shadow correctly anyway.
LogBox.ignoreLogs(["(ADVICE)", "App Start Span"]);

void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  // The site is set in Inter; the heavy weights carry most of its character,
  // the numbers are black italic, and the calendar's stamp is hand lettered.
  const [loaded, error] = useFonts({
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    Inter_900Black_Italic,
    PermanentMarker_400Regular,
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
          headerStyle: { backgroundColor: colors.night },
          headerTintColor: colors.cream,
          headerTitleStyle: { fontFamily: fonts.black },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.night },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/*
          No headerBackTitle here: this screen opens from both Home and Stats,
          so the label belongs to whoever pushed it. seasons.tsx sets it from
          the `from` param.
        */}
        {/* The page carries its own heading, so the bar only holds the back button. */}
        <Stack.Screen name="seasons" options={{ title: "" }} />
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
