"use client";

import { useEffect, useRef } from "react";

interface PreviewProps {
  number: number;
  season: string;
  player?: string;
  className?: string;
  type?: "short" | "thumbnail";
}

function getFittedFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
): number {
  let fontSize = initialSize;
  ctx.font = `${fontSize}px InterBlack`;

  while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
    fontSize -= 5;
    ctx.font = `${fontSize}px InterBlack`;
  }

  return fontSize;
}

function drawPlayerBox(
  ctx: CanvasRenderingContext2D,
  player: string,
  y: number,
) {
  if (!player) return;
  const maxWidth = 800;
  const padding = 40;
  const borderRadius = 50;
  const initialFontSize = 120;

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
  const lineHeight = fontSize + 20;
  const boxHeight = lineHeight * 2 + padding * 2; // Height for two lines
  const boxY = y - boxHeight / 2;

  // Draw rounded rectangle
  ctx.fillStyle = "#17002d";
  ctx.beginPath();
  ctx.roundRect(540 - maxWidth / 2, boxY, maxWidth, boxHeight, borderRadius);
  ctx.fill();

  // Draw both lines of text
  ctx.fillStyle = "#dfff00";
  ctx.textAlign = "center";
  ctx.font = `${fontSize}px InterBlack`;

  // Draw first line
  ctx.fillText(firstLine, 540, boxY + padding + lineHeight - 20);

  // Draw second line if it exists
  if (secondLine) {
    ctx.fillText(secondLine, 540, boxY + padding + lineHeight * 2 - 20);
  }
}

export function Preview({
  number,
  season,
  player = "",
  className = "",
  type = "short",
}: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load fonts first
    const fontFaces = [
      new FontFace("InterBlack", `url(/fonts/Inter-Black.ttf)`),
      new FontFace("InterExtraBold", `url(/fonts/Inter-ExtraBold.ttf)`),
    ];

    void Promise.all(fontFaces.map((font) => font.load())).then(
      (loadedFonts) => {
        loadedFonts.forEach((font) => document.fonts.add(font));

        // Draw background template
        const template = new window.Image();
        template.src =
          type === "thumbnail"
            ? "/thumbnail-template.png"
            : "/shorts-template.png";
        template.onload = () => {
          ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

          if (type === "short") {
            // Draw white rectangle for video area
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 700, 1080, 608);

            // Add the season
            ctx.font = "120px InterBlack";
            ctx.fillStyle = "#17002d";
            ctx.textAlign = "center";
            ctx.fillText(season, 540, 1800);

            // Add the number
            ctx.font = "280px InterBlack";
            ctx.fillStyle = "#ff00ff";
            ctx.textAlign = "center";
            ctx.fillText(number.toString(), 540, 1720);
          } else {
            ctx.font = "150px InterBlack";
            ctx.fillStyle = "#17002d";
            ctx.textAlign = "center";
            ctx.fillText(season, 540, 1300);

            ctx.font = "500px InterBlack";
            ctx.fillStyle = "#ff00ff";
            ctx.textAlign = "center";
            ctx.fillText(number.toString(), 530, 1200);

            if (player && type === "thumbnail") {
              drawPlayerBox(ctx, player, 1620);
            }
          }
        };
      },
    );
  }, [number, season, player, type]);

  return (
    <div className={`relative aspect-[9/16] w-full ${className}`}>
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        className="h-full w-full rounded-lg"
      />
    </div>
  );
}
