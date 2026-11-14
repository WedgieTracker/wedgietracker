/**
 * The No Dunks palette, ported from the web app's tokens
 * (apps/web/src/styles/globals.css): cream lettering on a grainy
 * blue-to-purple badge, a violet accent and a night background.
 *
 * The older names stay, as they do on the web, so every screen picks the
 * palette up: "yellow" is the cream, "pink" the violet accent and
 * "darkpurple" the night background with its panel shades.
 */
const cream = "#F0E1B6";
const violet = "#9A5CF5";
const night = "#140A2E";
const panel = "#1D1242";

export const colors = {
  cream,
  violet,
  night,
  panel,
  // The dark ink on cream stickers and buttons.
  ink: "#2A1660",
  // The shot marker on the court.
  shot: "#FF6FD8",

  yellow: cream,
  pink: violet,
  darkpurple: night,
  darkpurpleLight: panel,
  darkpurpleLighter: "#2A1A5C",
  darkpurpleDark: "#100825",
  darkpurpleDarker: "#0C061C",

  white: "#FFFFFF",
  white60: "rgba(255, 255, 255, 0.6)",
  white50: "rgba(255, 255, 255, 0.5)",

  cream80: "rgba(240, 225, 182, 0.8)",
  cream70: "rgba(240, 225, 182, 0.7)",
  cream50: "rgba(240, 225, 182, 0.5)",
  cream20: "rgba(240, 225, 182, 0.2)",

  violet15: "rgba(154, 92, 245, 0.15)",
  violet20: "rgba(154, 92, 245, 0.2)",
  violet60: "rgba(154, 92, 245, 0.6)",

  rowIdle: panel,
  rowActive: "#2A1A5C",

  muted: "rgba(240, 225, 182, 0.6)",
  faint: "rgba(240, 225, 182, 0.38)",
  // The faint violet edge on panels.
  hairline: "rgba(154, 92, 245, 0.2)",

  live: "#EF4444",
} as const;

/**
 * The gradients behind `bg-badge`, `bg-button`, `bg-glow` and `bg-glow-x`.
 * `angle` is the CSS angle in degrees.
 */
export const gradients = {
  // The No Dunks badge: blue in the top left to purple in the bottom right.
  badge: {
    angle: 150,
    stops: [
      [0, "#4769C5"],
      [0.22, "#3650A1"],
      [0.45, "#36378D"],
      [0.75, "#441C77"],
      [1, "#502394"],
    ],
  },
  // Darker than the badge, so cream text on it stays at 4.5:1.
  button: {
    angle: 135,
    stops: [
      [0, "#3F5DC2"],
      [0.5, "#5543C9"],
      [1, "#7438CF"],
    ],
  },
  glow: {
    angle: 135,
    stops: [
      [0, "#5F84E6"],
      [0.45, "#7B6BF0"],
      [1, "#A65FF5"],
    ],
  },
  glowX: {
    angle: 90,
    stops: [
      [0, "#5F84E6"],
      [0.5, "#7B6BF0"],
      [1, "#A65FF5"],
    ],
  },
} as const satisfies Record<
  string,
  { angle: number; stops: readonly (readonly [number, string])[] }
>;

export type GradientName = keyof typeof gradients;

/**
 * `text-shadow-badge`: cream numbers on the badge get a dark drop, like the
 * No Dunks lettering. React Native draws one shadow, so this is the hard one.
 */
export function badgeTextShadow(fontSize: number) {
  return {
    textShadowColor: "#2A1A5C",
    textShadowOffset: { width: 0, height: Math.max(1, fontSize * 0.04) },
    textShadowRadius: 0,
  } as const;
}

/**
 * Shared text styles. The site leans on Inter's heaviest weights with tight
 * tracking for numbers.
 */
export const type = {
  title: { fontFamily: "Inter_900Black", fontSize: 28, letterSpacing: -0.8 },
  section: { fontFamily: "Inter_900Black", fontSize: 13, letterSpacing: 1.4 },
  body: { fontFamily: "Inter_700Bold", fontSize: 15 },
  label: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 0.6 },
  stat: { fontFamily: "Inter_900Black", fontSize: 34, letterSpacing: -1.2 },
} as const;

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
 * The numbers are set in black italic, which needs its own face.
 */
export const fonts = {
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
  black: "Inter_900Black",
  blackItalic: "Inter_900Black_Italic",
  marker: "PermanentMarker_400Regular",
} as const;
