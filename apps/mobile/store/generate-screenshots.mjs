#!/usr/bin/env node
/**
 * Builds the App Store screenshot set from the raw simulator captures.
 *
 *   node apps/mobile/store/generate-screenshots.mjs
 *
 *   store/
 *     generate-screenshots.mjs   this file
 *     lib/text-to-path.mjs       Inter outlines, because the machine has no Inter
 *     captures/                  raw device captures, the inputs, committed
 *     screenshots/ios-6.9/       the uploadable set, regenerated from the above
 *
 * Inputs are the untouched device captures in ./captures, taken on an
 * iPhone 17 Pro Max simulator, which is a 6.9" display and renders at exactly
 * 1320x2868 - one of the three portrait sizes App Store Connect accepts for
 * that class. Supplying 6.9" is what satisfies the iPhone requirement; every
 * smaller iPhone class is scaled from it by Apple. Nothing here is ever scaled
 * up: the capture is the largest thing on the canvas and is only ever reduced.
 *
 * Re-capturing, should the app change:
 *   xcrun simctl boot "iPhone 17 Pro Max"
 *   xcrun simctl status_bar <udid> override --time 9:41 --cellularBars 4 \
 *     --dataNetwork wifi --wifiBars 3 --batteryState charged --batteryLevel 100
 *   # hide Expo Go's floating dev-tools button, which otherwise lands in frame:
 *   #   EXDevMenuShowFloatingActionButton = NO in Expo Go's preferences plist
 *   xcrun simctl io <udid> screenshot apps/mobile/store/captures/<screen>.png
 *
 * The marketing furniture - ground, wordmark, headline - is drawn as SVG and
 * rasterised once per screenshot, so the whole set rebuilds from vector plus
 * the captures. Headlines live in SCREENSHOTS below; changing one is a one-line
 * edit and a re-run.
 *
 * Not covered here: app.json sets ios.supportsTablet, so App Store Connect will
 * also demand a 13" iPad set at 2064x2752 (or 2048x2732) before the listing can
 * be submitted. Either capture an iPad Pro 13" run through this same pipeline or
 * turn supportsTablet off.
 */

import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadFont, measureText, textToPath } from "./lib/text-to-path.mjs";

const require = createRequire(import.meta.url);

/**
 * The set, in the order they should appear on the product page.
 *
 * `top` is the big yellow line, `bottom` the smaller pink one that overlaps it
 * from behind - the same two-line device as the wordmark and as every page
 * heading inside the app. Keep both lines short and uppercase; the layout
 * shrinks anything too wide to fit rather than wrapping it.
 */
const SCREENSHOTS = [
  // The wordmark appears on the first tile only. The product page already puts
  // the app icon and name directly above the row, so repeating it on every
  // tile is redundant. The headline stays at the same height on all five so
  // the row still lines up side by side.
  {
    capture: "home.png",
    top: "BALL STUCK.",
    bottom: "WE COUNT IT.",
    wordmark: true,
  },
  { capture: "all-wedgies.png", top: "EVERY ONE", bottom: "SINCE 2014" },
  { capture: "detail.png", top: "WATCH", bottom: "THE TAPE" },
  { capture: "standings.png", top: "WHO'S GOT", bottom: "THE MOST" },
  { capture: "stats.png", top: "TOO MANY", bottom: "NUMBERS" },
];

/** Brand tokens, from apps/mobile/lib/theme.ts. */
const BRAND = {
  yellow: "#EAFF00",
  pink: "#FF00FF",
  purple: "#12002E",
  purpleLight: "#1F004D",
  purpleDarker: "#0A001A",
};

/**
 * 6.9" portrait. App Store Connect accepts 1260x2736, 1290x2796 or 1320x2868
 * for this class; 1320x2868 is what the iPhone 17 Pro Max simulator produces,
 * so the capture needs no resampling at all in the vertical axis of the frame.
 */
const CANVAS = { width: 1320, height: 2868 };

/**
 * Composition, all in canvas pixels.
 *
 * The device sits below the headline rather than bleeding off the top, so no
 * marketing text can ever collide with the capture's own status bar or the
 * Dynamic Island cut-out - a collision Apple's reviewers do flag.
 */
const LAYOUT = {
  margin: 110,
  wordmark: { top: 120, width: 380 },
  headline: { capTop: 356, topSize: 152, bottomSize: 96, tracking: -0.04 },
  /**
   * How far the pink line rides up into the yellow one, as a share of its own
   * cap height. Kept small: PageHeading overlaps a half-size lower line, and at
   * the ratio used here anything more starts eating the pink line's counters.
   */
  headlineOverlap: 0.06,
  device: { top: 616, width: 984, bezel: 16 },
};

/** The wordmark's own coordinate system, from wordmark.svg's viewBox. */
const MARK = { width: 200, height: 62.87 };

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(mobileRoot, "../..");
const captureDir = path.join(scriptDir, "captures");
const outDir = path.join(scriptDir, "screenshots/ios-6.9");

/** sharp is a transitive dependency, so fall back to the pnpm store. */
async function loadSharp() {
  try {
    return require("sharp");
  } catch {
    const store = path.join(repoRoot, "node_modules/.pnpm");
    const entries = await fs.readdir(store);
    const match = entries.find((entry) => entry.startsWith("sharp@"));
    if (!match) throw new Error("Could not find sharp in node_modules/.pnpm");
    return require(path.join(store, match, "node_modules/sharp"));
  }
}

const round = (value) => Number(value.toFixed(2));

/** Everything between wordmark.svg's <defs> and its closing tag. */
async function readWordmarkInner() {
  const markup = await fs.readFile(
    path.join(mobileRoot, "assets/icons/wordmark.svg"),
    "utf8",
  );
  return markup
    .slice(markup.indexOf("<defs>"), markup.lastIndexOf("</svg>"))
    .trimEnd();
}

/**
 * Sets one headline line, shrinking it if it would run past the margins.
 * Shrinking rather than wrapping keeps every screenshot's headline exactly two
 * lines tall, which is what holds the set together visually.
 */
function fitLine(font, text, size, maxWidth) {
  const tracking = LAYOUT.headline.tracking;
  const width = measureText(font, text, {
    fontSize: size,
    letterSpacing: size * tracking,
  });
  return width <= maxWidth ? size : size * (maxWidth / width);
}

function headlineMarkup(font, { top, bottom }) {
  const { margin, headline, headlineOverlap } = LAYOUT;
  const maxWidth = CANVAS.width - margin * 2;
  const capRatio = font.capHeight / font.unitsPerEm;

  const topSize = fitLine(font, top, headline.topSize, maxWidth);
  const bottomSize = fitLine(font, bottom, headline.bottomSize, maxWidth);
  const topCap = topSize * capRatio;
  const bottomCap = bottomSize * capRatio;

  const topBaseline = headline.capTop + topCap;
  const bottomBaseline = topBaseline + bottomCap * (1 - headlineOverlap);

  const line = (text, size, baseline) => {
    const letterSpacing = size * headline.tracking;
    const width = measureText(font, text, { fontSize: size, letterSpacing });
    return textToPath(font, text, {
      fontSize: size,
      letterSpacing,
      x: (CANVAS.width - width) / 2,
      baseline,
    }).d;
  };

  // The pink line is drawn first so it sits behind the yellow one, matching
  // `zIndex: -1` on PageHeading's lower line.
  return [
    `  <path d="${line(bottom, bottomSize, bottomBaseline)}" fill="${BRAND.pink}" />`,
    `  <path d="${line(top, topSize, topBaseline)}" fill="${BRAND.yellow}" />`,
  ].join("\n");
}

function backgroundMarkup(wordmarkInner, showWordmark) {
  const { wordmark, device } = LAYOUT;
  const markScale = wordmark.width / MARK.width;
  const markX = (CANVAS.width - wordmark.width) / 2;

  const deviceX = (CANVAS.width - device.width) / 2;
  const deviceHeight = Math.round(
    (device.width * CANVAS.height) / CANVAS.width,
  );
  // The real 6.9" display corner is 55pt, i.e. 165px at 3x on the capture.
  const innerRadius = Math.round((165 * device.width) / CANVAS.width);
  const outerRadius = innerRadius + device.bezel;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="${CANVAS.height}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1A013D" />
      <stop offset="0.3" stop-color="${BRAND.purple}" />
      <stop offset="1" stop-color="${BRAND.purpleDarker}" />
    </linearGradient>
    <!--
      The magenta wash sits low, level with the device's shoulders. Higher up it
      tinted the ground behind the headline, and a pink line on a pink ground is
      the first thing to disappear at App Store thumbnail size.
    -->
    <radialGradient id="glow" cx="${CANVAS.width / 2}" cy="1280" r="1160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${BRAND.pink}" stop-opacity="0.45" />
      <stop offset="0.55" stop-color="${BRAND.pink}" stop-opacity="0.12" />
      <stop offset="1" stop-color="${BRAND.pink}" stop-opacity="0" />
    </radialGradient>
${wordmarkInner
  .slice(
    wordmarkInner.indexOf("<linearGradient"),
    wordmarkInner.indexOf("</defs>"),
  )
  .trimEnd()
  .split("\n")
  .map((l) => "    " + l.trim())
  .join("\n")}
  </defs>
  <rect width="${CANVAS.width}" height="${CANVAS.height}" fill="url(#ground)" />
  <rect width="${CANVAS.width}" height="${CANVAS.height}" fill="url(#glow)" />
  ${
    showWordmark
      ? `<g transform="translate(${round(markX)} ${wordmark.top}) scale(${round(markScale)})">
${wordmarkInner
  .slice(wordmarkInner.indexOf("</defs>") + "</defs>".length)
  .trim()
  .split("\n")
  .map((l) => "    " + l.trim())
  .join("\n")}
  </g>`
      : ""
  }
  <rect x="${deviceX - device.bezel}" y="${device.top - device.bezel}" width="${device.width + device.bezel * 2}" height="${deviceHeight + device.bezel * 2}" rx="${outerRadius}" fill="#000000" />
  <rect x="${deviceX - device.bezel}" y="${device.top - device.bezel}" width="${device.width + device.bezel * 2}" height="${deviceHeight + device.bezel * 2}" rx="${outerRadius}" fill="none" stroke="${BRAND.yellow}" stroke-opacity="0.16" stroke-width="2" />
  __HEADLINE__
</svg>
`;
}

/** A rounded-corner alpha mask, so the capture's square corners do not poke out of the bezel. */
function cornerMask(width, height, radius) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff" /></svg>`,
  );
}

async function main() {
  const sharp = await loadSharp();
  const font = await loadFont(
    path.join(
      repoRoot,
      "node_modules/.pnpm/@expo-google-fonts+inter@0.4.2/node_modules",
      "@expo-google-fonts/inter/900Black/Inter_900Black.ttf",
    ),
  );
  const wordmarkInner = await readWordmarkInner();

  const { device } = LAYOUT;
  const deviceX = (CANVAS.width - device.width) / 2;
  const deviceHeight = Math.round(
    (device.width * CANVAS.height) / CANVAS.width,
  );
  const innerRadius = Math.round((165 * device.width) / CANVAS.width);

  await fs.mkdir(outDir, { recursive: true });

  for (const [index, entry] of SCREENSHOTS.entries()) {
    const template = backgroundMarkup(wordmarkInner, Boolean(entry.wordmark));
    const svg = template.replace("__HEADLINE__", headlineMarkup(font, entry));

    // 72 is sharp's baseline DPI, so one SVG user unit rasterises as one pixel.
    const ground = sharp(Buffer.from(svg), { density: 72 });

    const screen = await sharp(path.join(captureDir, entry.capture))
      .resize(device.width, deviceHeight, { kernel: "lanczos3" })
      .composite([
        {
          input: cornerMask(device.width, deviceHeight, innerRadius),
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();

    const slug = path.basename(entry.capture, ".png");
    const file = path.join(
      outDir,
      `${String(index + 1).padStart(2, "0")}-${slug}.png`,
    );

    await ground
      .composite([{ input: screen, left: deviceX, top: device.top }])
      // Apple rejects screenshots that carry an alpha channel (ITMS-90842),
      // so the canvas is flattened onto the ground colour before writing.
      .flatten({ background: BRAND.purpleDarker })
      .removeAlpha()
      .png({ compressionLevel: 9 })
      .toFile(file);

    const meta = await sharp(file).metadata();
    console.log(
      `${path.basename(file).padEnd(26)} ${meta.width}x${meta.height}  ` +
        `channels=${meta.channels}  alpha=${meta.hasAlpha}  space=${meta.space}`,
    );
  }
}

await main();
