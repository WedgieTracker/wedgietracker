#!/usr/bin/env node
/**
 * Regenerates every WedgieTracker app-icon raster from vector sources.
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
 *   - The Android foreground/monochrome keep transparency (Expo passes
 *     `backgroundColor: "transparent"` for adaptive icons) and are scaled to the
 *     inner 72dp of the 108dp adaptive canvas, the guaranteed-visible safe zone.
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

/** Brand tokens: --yellow / --pink from apps/web/src/styles/globals.css. */
const BRAND = {
  purple: "#12002E",
  pink: "#FF00FF",
  yellow: "#EAFF00",
};

/**
 * Fraction of the canvas the wordmark spans.
 *
 * `ios` leaves a ~9% margin so the wordmark never runs into the squircle mask.
 * `adaptive` keeps the mark inside the Android safe zone: the adaptive icon is
 * 108x108dp and only the inner 72x72dp (0.667) is guaranteed visible. 0.62
 * keeps even the corners of the wordmark's bounding box inside the 72dp
 * circular mask, which is the tightest of the standard launcher masks.
 */
const WIDTH_RATIO = {
  ios: 0.82,
  adaptive: 0.62,
  splash: 0.86,
};

const compositions = [
  {
    vector: "icon-light.svg",
    raster: "icon.png",
    widthRatio: WIDTH_RATIO.ios,
    background: BRAND.purple,
    wedgie: BRAND.pink,
    tracker: BRAND.yellow,
    flatten: BRAND.purple,
  },
  {
    vector: "icon-dark.svg",
    raster: "ios-dark.png",
    widthRatio: WIDTH_RATIO.ios,
    background: null,
    wedgie: BRAND.pink,
    tracker: BRAND.yellow,
  },
  {
    vector: "icon-tinted.svg",
    raster: "ios-tinted.png",
    widthRatio: WIDTH_RATIO.ios,
    background: "#000000",
    // Luminance, not hue, drives the system tint: the yellow line is the
    // brighter of the two, so it becomes white and the pink line a mid grey.
    // Straight desaturation would have pushed the pink down to ~40% and lost it.
    wedgie: "#B3B3B3",
    tracker: "#FFFFFF",
    flatten: "#000000",
  },
  {
    vector: "android-foreground.svg",
    raster: "android-icon-foreground.png",
    widthRatio: WIDTH_RATIO.adaptive,
    background: null,
    wedgie: BRAND.pink,
    tracker: BRAND.yellow,
  },
  {
    vector: "android-background.svg",
    raster: "android-icon-background.png",
    widthRatio: 0,
    background: BRAND.purple,
    wedgie: BRAND.pink,
    tracker: BRAND.yellow,
    flatten: BRAND.purple,
  },
  {
    // Android themed icons read the alpha channel only, so the fill colour is
    // arbitrary; what matters is that the gradient's alpha ramp survives.
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
    wedgie: BRAND.pink,
    tracker: BRAND.yellow,
  },
  {
    vector: "icon-light.svg",
    raster: "favicon.png",
    widthRatio: WIDTH_RATIO.ios,
    background: BRAND.purple,
    wedgie: BRAND.pink,
    tracker: BRAND.yellow,
    flatten: BRAND.purple,
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

/**
 * wordmark.svg spells its two brand colours as literal hex so that every other
 * palette can be derived by substitution.
 */
function recolor(markup, wedgie, tracker) {
  return markup
    .replaceAll(BRAND.pink, wedgie)
    .replaceAll(BRAND.yellow, tracker);
}

/** Strips the source file's own indentation and re-indents under `prefix`. */
function reindent(markup, prefix) {
  const lines = markup.split("\n");
  const base = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.length - line.trimStart().length),
  );
  return lines
    .map((line) => (line.trim() ? prefix + line.slice(base) : line))
    .join("\n");
}

function compose(markInner, { widthRatio, background, wedgie, tracker }) {
  const layers = [];
  if (background) {
    layers.push(
      `  <rect width="${CANVAS}" height="${CANVAS}" fill="${background}" />`,
    );
  }
  if (widthRatio > 0) {
    const scale = (CANVAS * widthRatio) / MARK.width;
    const x = (CANVAS - MARK.width * scale) / 2;
    const y = (CANVAS - MARK.height * scale) / 2;
    const inner = reindent(recolor(markInner, wedgie, tracker), "    ");
    layers.push(
      `  <g transform="translate(${round(x)} ${round(y)}) scale(${round(scale)})">`,
      inner,
      `  </g>`,
    );
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
    `  <!-- Generated by scripts/generate-icons.mjs from wordmark.svg. Do not edit by hand. -->`,
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
  // Everything between the <svg> wrapper and its close: the gradient defs plus
  // the two lettering groups. The leading indent is restored so that reindent()
  // sees the first line at the same depth as the rest.
  const markInner =
    "  " +
    wordmark
      .slice(wordmark.indexOf("<defs>"), wordmark.lastIndexOf("</svg>"))
      .trimEnd();

  for (const composition of compositions) {
    const svg = compose(markInner, composition);
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
