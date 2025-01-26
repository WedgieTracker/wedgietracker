import fs from "fs";
import {
  createCanvas,
  loadImage,
  registerFont,
  type CanvasRenderingContext2D,
} from "canvas";
import path from "path";

// Register Inter font
registerFont(path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"), {
  family: "InterBold",
  weight: "bold",
});

// add black font
registerFont(path.join(process.cwd(), "public/fonts/Inter-Black.ttf"), {
  family: "InterBlack",
  weight: "900",
});

// add extra bold font
registerFont(path.join(process.cwd(), "public/fonts/Inter-ExtraBold.ttf"), {
  family: "InterExtraBold",
  weight: "800",
});

// Add this function at the top with other utility functions
function getFittedFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
): number {
  let fontSize = initialSize;
  ctx.font = `${fontSize}px InterBlack`;

  while (ctx.measureText(text).width > maxWidth && fontSize > 40) {
    fontSize -= 10;
    ctx.font = `${fontSize}px InterBlack`;
  }

  return fontSize;
}

// Update the drawPlayerBox function similar to the Preview.tsx version
function drawPlayerBox(
  ctx: CanvasRenderingContext2D,
  player: string,
  y: number,
) {
  if (!player) return;
  const maxWidth = 1600;
  const padding = 80;
  const borderRadius = 100;
  const initialFontSize = 240;

  // Split the player name roughly in half for two lines
  const words = player.toUpperCase().split(" ");
  const midpoint = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, midpoint).join(" ");
  const secondLine = words.slice(midpoint).join(" ");

  // Get font sizes for both lines
  const firstLineFontSize = getFittedFontSize(
    ctx,
    firstLine,
    maxWidth - padding * 2,
    initialFontSize,
  );
  const secondLineFontSize = getFittedFontSize(
    ctx,
    secondLine,
    maxWidth - padding * 2,
    initialFontSize,
  );

  // Use the smaller font size for both lines to maintain consistency
  const fontSize = Math.min(firstLineFontSize, secondLineFontSize);
  const lineHeight = fontSize + 40;
  const boxHeight = lineHeight * 2 + padding * 2; // Height for two lines
  const boxY = y - boxHeight / 2;

  // Draw rounded rectangle
  ctx.fillStyle = "#17002d";
  ctx.beginPath();
  ctx.roundRect(1080 - maxWidth / 2, boxY, maxWidth, boxHeight, borderRadius);
  ctx.fill();

  // Draw both lines of text
  ctx.fillStyle = "#dfff00";
  ctx.textAlign = "center";
  ctx.font = `${fontSize}px InterBlack`;

  // Draw first line
  ctx.fillText(firstLine, 1080, boxY + padding + lineHeight - 40);

  // Draw second line if it exists
  if (secondLine) {
    ctx.fillText(secondLine, 1080, boxY + padding + lineHeight * 2 - 40);
  }
}

export async function createBackground(
  number: number,
  season: string,
  player: string,
  type: "short" | "thumbnail" | "reel" = "short",
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

  if (type === "thumbnail") {
    // Existing thumbnail logic
    const seasonFontSize = getFittedFontSize(ctx, season, 1600, 300);
    ctx.font = `${seasonFontSize}px InterBlack`;
    ctx.fillStyle = "#17002d";
    ctx.textAlign = "center";
    ctx.fillText(season, width / 2, 2600);

    const numberFontSize = getFittedFontSize(
      ctx,
      number.toString(),
      1600,
      1000,
    );
    ctx.font = `${numberFontSize}px InterBlack`;
    ctx.fillStyle = "#ff00ff";
    ctx.textAlign = "center";
    ctx.fillText(number.toString(), width / 2 - 20, 2400);

    if (player) {
      drawPlayerBox(ctx, player, 3240);
    }
  } else if (type === "reel") {
    // Add the season
    ctx.font = "120px InterBlack";
    ctx.fillStyle = "#17002d";
    ctx.textAlign = "center";
    ctx.fillText(season, width / 2, 1780);

    // New reel layout with scaled dimensions
    ctx.font = "280px InterBlack";
    ctx.fillStyle = "#ff00ff";
    ctx.textAlign = "center";
    ctx.fillText(number.toString(), width / 2, 1700);
  } else {
    // Existing shorts logic
    ctx.font = "240px InterBlack";
    ctx.fillStyle = "#17002d";
    ctx.textAlign = "center";
    ctx.fillText(season, width / 2, 3600);

    ctx.font = "560px InterBlack";
    ctx.fillStyle = "#ff00ff";
    ctx.textAlign = "center";
    ctx.fillText(number.toString(), width / 2, 3440);
  }

  // Save to temp file
  const outputPath = `/tmp/background_${Date.now()}.png`;
  const out = canvas.createPNGStream();
  const stream = fs.createWriteStream(outputPath);

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    out.pipe(stream);
  });

  return outputPath;
}
