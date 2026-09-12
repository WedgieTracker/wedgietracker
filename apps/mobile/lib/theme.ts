/**
 * Ported from the web app's CSS custom properties (see
 * apps/web/src/styles/globals.css) so both clients read as one product.
 */
export const colors = {
  // --yellow: 65 100% 50%
  yellow: "#EAFF00",
  // --pink: 300 100% 50%
  pink: "#FF00FF",
  // --darkpurple: 264 100% 9%, plus the lighter steps from tailwind.config.ts
  darkpurple: "#12002E",
  darkpurpleLight: "#1F004D",
  darkpurpleLighter: "#290066",
  darkpurpleDark: "#0E0024",

  white: "#FFFFFF",
  muted: "rgba(255, 255, 255, 0.62)",
  faint: "rgba(255, 255, 255, 0.38)",
  hairline: "rgba(234, 255, 0, 0.16)",
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
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

/**
 * The site leans on very heavy weights and tight tracking for numbers; System
 * at 900 is the closest match without shipping a font file.
 */
export const type = {
  hero: { fontSize: 76, fontWeight: "900", letterSpacing: -3 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.8 },
  section: { fontSize: 13, fontWeight: "800", letterSpacing: 1.4 },
  body: { fontSize: 15, fontWeight: "500" },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },
  stat: { fontSize: 34, fontWeight: "900", letterSpacing: -1.2 },
} as const;
