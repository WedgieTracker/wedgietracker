import { useWindowDimensions } from "react-native";

const ROOT_FONT_SIZE = 16;

/**
 * CSS `clamp(min, remPart + vwPart, max)` for React Native.
 *
 * The web app sizes almost everything fluidly (see tailwind.config.ts and the
 * inline `clamp()` styles in the home components). Re-deriving the same numbers
 * here keeps the two clients visually identical instead of approximating with
 * fixed sizes.
 */
export function clampRem(
  minRem: number,
  remPart: number,
  vwPart: number,
  maxRem: number,
  viewportWidth: number,
): number {
  const preferred = remPart * ROOT_FONT_SIZE + (vwPart / 100) * viewportWidth;
  return Math.min(
    Math.max(minRem * ROOT_FONT_SIZE, preferred),
    maxRem * ROOT_FONT_SIZE,
  );
}

/**
 * The fluid sizes used by the home screen, resolved for the current viewport.
 * Names and values mirror the web app so the two stay in step.
 */
export function useFluidType() {
  const { width } = useWindowDimensions();
  const c = (min: number, rem: number, vw: number, max: number) =>
    clampRem(min, rem, vw, max, width);

  return {
    // tailwind.config.ts fontSize entries (mobile variants)
    bigNumber: c(7, 6, 16, 18),
    wedgiesText: c(1.5, 0.5, 7, 3),
    paceText: c(2, 1, 2, 2.5),
    paceNumber: c(4.5, 3, 2, 5),
    buttonText: c(1, 0.8, 0.5, 2),

    // Wedgie.tsx "default" variant
    wedgieNumber: c(2, 1.5, 3, 3.5),
    wedgieHash: c(0.875, 0.8, 0.5, 1),
    wedgieDate: c(0.6, 0.3, 0.1, 0.7),
    playerName: c(1.1, 0.8, 1, 1.75),
    teamName: c(0.8, 0.6, 1, 1.125),
    types: c(0.7, 0.5, 1, 1),
    watch: c(0.7, 0.5, 0.3, 0.8),

    // StandingsList.tsx
    standingsNumber: c(0.875, 0.8, 0.5, 1.125),
    standingsHash: c(0.75, 0.7, 0.3, 0.875),
    standingsTitle: c(1.2, 0.8, 0.5, 1.75),
    standingsName: c(0.85, 0.75, 0.5, 1.25),
  };
}
