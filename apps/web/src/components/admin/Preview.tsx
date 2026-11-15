"use client";

import { useEffect, useRef } from "react";
import { drawWedgieOverlay, type OverlayType } from "~/lib/wedgieOverlay";

interface PreviewProps {
  number: number;
  season: string;
  player?: string;
  /** The wedgie's date, drawn as dd/mm */
  date?: string;
  className?: string;
  type?: OverlayType;
}

const TEMPLATE: Record<OverlayType, string> = {
  short: "/shorts-template.png",
  thumbnail: "/thumbnail-template.png",
  reel: "/reel-template.png",
};

/** Where the clip sits, in the 1080 x 1920 preview. */
const CLIP: Partial<Record<OverlayType, [number, number]>> = {
  short: [700, 608],
  reel: [700, 608],
};

/**
 * The template with the same text the server draws on it, at 1080 x 1920.
 * The Short and cover are 2160 wide, so they are drawn at half size.
 */
export function Preview({
  number,
  season,
  player = "",
  date,
  className = "",
  type = "short",
}: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The same Inter files the server registers, under the same names
    const fontFaces = [
      new FontFace("InterBlack", `url(/fonts/Inter-Black.ttf)`),
      new FontFace("InterExtraBold", `url(/fonts/Inter-ExtraBold.ttf)`),
      new FontFace("InterBlackItalic", `url(/fonts/Inter-BlackItalic.ttf)`),
    ];

    void Promise.all(fontFaces.map((font) => font.load())).then(
      (loadedFonts) => {
        loadedFonts.forEach((font) => document.fonts.add(font));

        const template = new window.Image();
        template.src = TEMPLATE[type];
        template.onload = () => {
          ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

          const clip = CLIP[type];
          if (clip) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, clip[0], canvas.width, clip[1]);
          }

          drawWedgieOverlay(
            ctx,
            { number, season, player, date },
            type,
            canvas.width / (type === "reel" ? 1080 : 2160),
          );
        };
      },
    );
  }, [number, season, player, date, type]);

  return (
    <div className={`relative aspect-9/16 w-full ${className}`}>
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        className="h-full w-full rounded-lg"
      />
    </div>
  );
}
