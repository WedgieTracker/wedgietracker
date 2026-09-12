/**
 * Ported from the web app's CSS custom properties (apps/web/src/styles/globals.css)
 * and tailwind.config.ts so both clients read as one product.
 */
export const colors = {
  // --yellow: 65 100% 50%
  yellow: "#EAFF00",
  // --pink: 300 100% 50%
  pink: "#FF00FF",
  // --darkpurple: 264 100% 9%, plus the steps defined in tailwind.config.ts
  darkpurple: "#12002E",
  darkpurpleLight: "#1F004D",
  darkpurpleLighter: "#290066",
  darkpurpleDark: "#0E0024",
  darkpurpleDarker: "#0A001A",

  white: "#FFFFFF",
  // The web app uses white at these alphas throughout the home page
  white60: "rgba(255, 255, 255, 0.6)",
  white50: "rgba(255, 255, 255, 0.5)",

  // bg-darkpurple-light/30 and /80, the wedgie + standings row states
  rowIdle: "rgba(31, 0, 77, 0.3)",
  rowActive: "rgba(31, 0, 77, 0.8)",

  // Secondary text, matching the white/60 and white/50 used on the site
  muted: "rgba(255, 255, 255, 0.6)",
  faint: "rgba(255, 255, 255, 0.38)",
  // The faint yellow card edge
  hairline: "rgba(234, 255, 0, 0.16)",

  live: "#EF4444",
} as const;

/**
 * Shared text styles. The site leans on Inter's heaviest weights with tight
 * tracking for numbers and wide tracking for small caps labels.
 */
export const type = {
  title: { fontFamily: "Inter_900Black", fontSize: 28, letterSpacing: -0.8 },
  section: { fontFamily: "Inter_900Black", fontSize: 13, letterSpacing: 1.4 },
  body: { fontFamily: "Inter_700Bold", fontSize: 15 },
  label: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 0.6 },
  stat: { fontFamily: "Inter_900Black", fontSize: 34, letterSpacing: -1.2 },
} as const;

/** Wave.tsx confetti palette */
export const confettiColors = [
  "#eaff00",
  "#ff03ff",
  "#180138",
  "#542299",
  "#efff40",
] as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 36,
} as const;

export const radius = {
  xs: 2,
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/**
 * The site is set in Inter, weighted heavily. These map to the faces loaded in
 * app/_layout.tsx; `fontWeight` alone will not pick the right face on Android.
 */
export const fonts = {
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
  black: "Inter_900Black",
} as const;
