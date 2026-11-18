#!/usr/bin/env node
/**
 * Regenerates every WedgieTracker app-icon and splash raster from vector sources.
 *
 *   node apps/mobile/scripts/generate-icons.mjs
 *   pnpm --filter @wedgietracker/mobile icons
 *
 * The single source of truth is assets/icons/wordmark.svg (the brand wordmark,
 * traced from apps/web/public/logo.svg). This script composes that mark into a
 * set of square SVGs, writes them next to it so the compositions stay vector and
 * inspectable, and only then rasterises each one at 1024x1024. Nothing is ever
 * upscaled from a bitmap.
 *
 * The app icon is the No Dunks "Solid" artwork: the wordmark on the night
 * background, with a blue glow from the top-left corner, a purple glow from the
 * foot, and the site's film grain over both. WEDGIE is a solid bright violet
 * rather than the logo's fade, so it still reads at home-screen size. The
 * splash keeps the logo exactly as the app header draws it, fade included.
 *
 * Why each variant looks the way it does:
 *
 *   - icon.png (iOS "light" + the cross-platform default) is fully opaque. An
 *     App Store icon that carries an alpha channel is rejected with ITMS-90717.
 *   - ios-dark.png has a transparent background. Apple: "Provide your dark app
 *     icon with a transparent background so the system-provided background can
 *     show through."
 *   - ios-tinted.png is grayscale, but opaque over black rather than
 *     transparent. Apple asks for "a grayscale image"; the opaque background is
 *     forced on us by Expo, which flattens every non-dark iOS variant onto solid
 *     white before writing the asset catalog. See withIosIcons.js in
 *     @expo/prebuild-config: `removeTransparency: appearance !== "dark"` and
 *     `backgroundColor: appearance !== "dark" ? "#ffffff" : undefined`. Shipping
 *     a transparent tinted icon would therefore land as a white slab.
 *   - The Android adaptive icon splits the light icon in two: the glowing night
 *     background on its own layer, and the wordmark as a transparent foreground
 *     scaled to the inner 72dp of the 108dp canvas, the guaranteed-visible safe
 *     zone. The monochrome layer keeps transparency too (Expo passes
 *     `backgroundColor: "transparent"` for adaptive icons).
 *   - splash-icon.png is transparent; expo-splash-screen paints the night
 *     background behind it from app.json.
 */

import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(mobileRoot, "../..");
const vectorDir = path.join(mobileRoot, "assets/icons");
const rasterDir = path.join(mobileRoot, "assets/images");

/** Rasterised canvas edge, in pixels. Apple and Google both want 1024. */
const CANVAS = 1024;

/** The wordmark's own coordinate system, from wordmark.svg's viewBox. */
const MARK = { width: 200, height: 62.87 };

/** No Dunks tokens, as in lib/theme.ts and apps/web/src/styles/globals.css. */
const BRAND = {
  night: "#140A2E",
  cream: "#F0E1B6",
  violet: "#9A5CF5",
  // A lighter violet for a solid WEDGIE on night, about 6.9:1 against it.
  bright: "#B48CFF",
  // The two ends of the site's badge gradient, used here as glows.
  glowTop: "#4769c5",
  glowFoot: "#502394",
};

/**
 * Fraction of the canvas the wordmark spans.
 *
 * `ios` leaves an 8% margin so the wordmark never runs into the squircle mask.
 * `adaptive` keeps the mark inside the Android safe zone: the adaptive icon is
 * 108x108dp and only the inner 72x72dp (0.667) is guaranteed visible. 0.62
 * keeps even the corners of the wordmark's bounding box inside the 72dp
 * circular mask, which is the tightest of the standard launcher masks.
 * `splash` matches the 880px wordmark on the 1024 splash canvas.
 */
const WIDTH_RATIO = {
  ios: 860 / CANVAS,
  adaptive: 0.62,
  splash: 880 / CANVAS,
};

/**
 * The icon artwork sits its wordmark 2.25 mark units below the box centre,
 * which balances the heavier TRACKER line by eye.
 */
const ICON_NUDGE = 2.25;

const solidIcon = {
  widthRatio: WIDTH_RATIO.ios,
  nudge: ICON_NUDGE,
  wedgie: BRAND.bright,
  tracker: BRAND.cream,
};

const compositions = [
  {
    ...solidIcon,
    vector: "icon-light.svg",
    raster: "icon.png",
    background: "glow",
    flatten: BRAND.night,
  },
  {
    ...solidIcon,
    vector: "icon-dark.svg",
    raster: "ios-dark.png",
    background: null,
  },
  {
    ...solidIcon,
    vector: "icon-tinted.svg",
    raster: "ios-tinted.png",
    background: "#000000",
    // Luminance, not hue, drives the system tint: cream TRACKER becomes white
    // and WEDGIE a light grey just below it, so the two lines stay apart.
    wedgie: "#D6D6D6",
    tracker: "#FFFFFF",
    flatten: "#000000",
  },
  {
    ...solidIcon,
    vector: "android-foreground.svg",
    raster: "android-icon-foreground.png",
    widthRatio: WIDTH_RATIO.adaptive,
    background: null,
  },
  {
    vector: "android-background.svg",
    raster: "android-icon-background.png",
    widthRatio: 0,
    background: "glow",
    flatten: BRAND.night,
  },
  {
    // Android themed icons read the alpha channel only, so the fill colour is
    // arbitrary; what matters is that both lines are fully opaque.
    ...solidIcon,
    vector: "android-monochrome.svg",
    raster: "android-icon-monochrome.png",
    widthRatio: WIDTH_RATIO.adaptive,
    background: null,
    wedgie: "#FFFFFF",
    tracker: "#FFFFFF",
  },
  {
    vector: "splash.svg",
    raster: "splash-icon.png",
    widthRatio: WIDTH_RATIO.splash,
    background: null,
    wedgie: BRAND.violet,
    fade: true,
    tracker: BRAND.cream,
  },
  {
    ...solidIcon,
    vector: "icon-light.svg",
    raster: "favicon.png",
    background: "glow",
    flatten: BRAND.night,
    size: 48,
  },
];

/** sharp is a transitive dependency, so fall back to the pnpm store. */
async function loadSharp() {
  try {
    return require("sharp");
  } catch {
    const store = path.join(repoRoot, "node_modules/.pnpm");
    const entries = await fs.readdir(store);
    const match = entries.find((entry) => entry.startsWith("sharp@"));
    if (!match) {
      throw new Error("Could not find sharp in node_modules/.pnpm");
    }
    return require(path.join(store, match, "node_modules/sharp"));
  }
}

const round = (value) => Number(value.toFixed(3));

/** The shapes inside `<g id="...">` in wordmark.svg, one per line. */
function shapesOf(wordmark, groupId) {
  const open = wordmark.indexOf(`<g id="${groupId}"`);
  if (open === -1) throw new Error(`wordmark.svg has no #${groupId} group`);
  const start = wordmark.indexOf(">", open) + 1;
  const end = wordmark.indexOf("</g>", start);
  return wordmark
    .slice(start, end)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * The night background with the site's two glows, and the film grain from
 * apps/web (fractal noise, desaturated, soft-light at 30%) over the lot.
 */
function glowBackground(defs) {
  defs.push(
    `    <filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`,
    `      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" seed="7" result="n" />`,
    `      <feColorMatrix in="n" type="saturate" values="0" result="m" />`,
    `      <feComponentTransfer in="m" result="o"><feFuncA type="linear" slope="0.3" /></feComponentTransfer>`,
    `      <feBlend in="o" in2="SourceGraphic" mode="soft-light" result="bl" />`,
    `      <feComposite in="bl" in2="SourceGraphic" operator="in" />`,
    `    </filter>`,
    `    <radialGradient id="glow-foot" cx="0.5" cy="1.08" r="0.7">`,
    `      <stop offset="0" stop-color="${BRAND.glowFoot}" stop-opacity=".85" />`,
    `      <stop offset="1" stop-color="${BRAND.glowFoot}" stop-opacity="0" />`,
    `    </radialGradient>`,
    `    <radialGradient id="glow-top" cx="0" cy="0" r="0.8">`,
    `      <stop offset="0" stop-color="${BRAND.glowTop}" stop-opacity=".45" />`,
    `      <stop offset="1" stop-color="${BRAND.glowTop}" stop-opacity="0" />`,
    `    </radialGradient>`,
  );
  return [
    `  <g filter="url(#grain)">`,
    `    <rect width="${CANVAS}" height="${CANVAS}" fill="${BRAND.night}" />`,
    `    <rect width="${CANVAS}" height="${CANVAS}" fill="url(#glow-foot)" />`,
    `    <rect width="${CANVAS}" height="${CANVAS}" fill="url(#glow-top)" />`,
    `  </g>`,
  ];
}

function compose(
  mark,
  { widthRatio, nudge = 0, background, wedgie, fade = false, tracker },
) {
  const defs = [];
  const layers = [];
  if (background === "glow") {
    layers.push(...glowBackground(defs));
  } else if (background) {
    layers.push(
      `  <rect width="${CANVAS}" height="${CANVAS}" fill="${background}" />`,
    );
  }
  if (widthRatio > 0) {
    let wedgieFill = wedgie;
    if (fade) {
      // WEDGIE fades out at its foot into TRACKER, exactly like logo.svg.
      defs.push(
        `    <linearGradient id="wedgie-fade" x1="0" y1="23.72" x2="0" y2="37.65" gradientUnits="userSpaceOnUse">`,
        `      <stop offset="0" stop-color="${wedgie}" />`,
        `      <stop offset="1" stop-color="${wedgie}" stop-opacity="0" />`,
        `    </linearGradient>`,
      );
      wedgieFill = "url(#wedgie-fade)";
    }
    const scale = (CANVAS * widthRatio) / MARK.width;
    const x = (CANVAS - MARK.width * scale) / 2;
    const y = (CANVAS - MARK.height * scale) / 2 + nudge * scale;
    layers.push(
      `  <g transform="translate(${round(x)} ${round(y)}) scale(${round(scale)})">`,
      `    <g fill="${wedgieFill}">`,
      ...mark.wedgie.map((shape) => `      ${shape}`),
      `    </g>`,
      `    <g fill="${tracker}">`,
      ...mark.tracker.map((shape) => `      ${shape}`),
      `    </g>`,
      `  </g>`,
    );
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
    `  <!-- Generated by scripts/generate-icons.mjs from wordmark.svg. Do not edit by hand. -->`,
    ...(defs.length ? [`  <defs>`, ...defs, `  </defs>`] : []),
    ...layers,
    `</svg>`,
    ``,
  ].join("\n");
}

async function main() {
  const sharp = await loadSharp();
  const wordmark = await fs.readFile(
    path.join(vectorDir, "wordmark.svg"),
    "utf8",
  );
  const mark = {
    wedgie: shapesOf(wordmark, "wedgie"),
    tracker: shapesOf(wordmark, "tracker"),
  };

  for (const composition of compositions) {
    const svg = compose(mark, composition);
    await fs.writeFile(path.join(vectorDir, composition.vector), svg);

    // 72 is sharp's baseline DPI, so 1 SVG user unit renders as exactly 1 px
    // and the 1024-unit viewBox rasterises at 1024x1024 with no resampling.
    let pipeline = sharp(Buffer.from(svg), { density: 72 });
    if (composition.flatten) {
      pipeline = pipeline
        .flatten({ background: composition.flatten })
        .removeAlpha();
    }
    if (composition.size && composition.size !== CANVAS) {
      pipeline = pipeline.resize(composition.size, composition.size, {
        kernel: "lanczos3",
      });
    }
    const output = path.join(rasterDir, composition.raster);
    await pipeline.png({ compressionLevel: 9 }).toFile(output);

    const meta = await sharp(output).metadata();
    console.log(
      `${composition.raster.padEnd(30)} ${meta.width}x${meta.height}  ` +
        `channels=${meta.channels}  alpha=${meta.hasAlpha}`,
    );
  }
}

await main();
