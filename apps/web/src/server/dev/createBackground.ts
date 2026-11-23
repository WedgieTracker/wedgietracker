import fs from "fs";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { drawWedgieOverlay, type OverlayType } from "~/lib/wedgieOverlay";

// The Inter files are Google's Inter, the same the site serves through
// next/font. Black is for the player's name.
registerFont(path.join(process.cwd(), "public/fonts/Inter-Black.ttf"), {
  family: "InterBlack",
  weight: "900",
});

// add extra bold font
registerFont(path.join(process.cwd(), "public/fonts/Inter-ExtraBold.ttf"), {
  family: "InterExtraBold",
  weight: "800",
});

// Shrikhand, for the big wedgie number, as the site and app set it. This copy
// has its italic angle set to 0 (outlines untouched): with Shrikhand's -14
// degrees, node-canvas on macOS never matched the face and drew a fallback.
// OFL, licence beside it in Shrikhand-OFL.txt.
registerFont(path.join(process.cwd(), "public/fonts/Shrikhand-Regular.ttf"), {
  family: "Shrikhand",
});

export async function createBackground(
  number: number,
  season: string,
  player: string,
  type: OverlayType = "short",
  /** The wedgie's date, drawn as dd/mm */
  date?: string | null,
) {
  // Create canvas with dimensions based on type
  const dimensions = {
    short: { width: 2160, height: 3840 },
    thumbnail: { width: 2160, height: 3840 },
    reel: { width: 1080, height: 1920 },
  };

  const { width, height } = dimensions[type];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load and draw the template based on type
  const templateName = {
    short: "shorts-template.png",
    thumbnail: "thumbnail-template.png",
    reel: "reel-template.png", // New 1080x1920 template
  }[type];

  const template = await loadImage(
    path.join(process.cwd(), "public", templateName),
  );
  ctx.drawImage(template, 0, 0, width, height);

  drawWedgieOverlay(ctx, { number, season, player, date }, type);

  // Save to temp file
  const outputPath = `/tmp/background_${Date.now()}.png`;
  const out = canvas.createPNGStream();
  const stream = fs.createWriteStream(outputPath);

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
    out.pipe(stream);
  });

  return outputPath;
}
