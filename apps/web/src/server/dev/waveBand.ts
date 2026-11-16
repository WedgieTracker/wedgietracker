import { spawn } from "child_process";
import type { Writable } from "stream";
import { createCanvas, loadImage } from "canvas";
import path from "path";
import { drawWedgieOverlay, type OverlayData } from "~/lib/wedgieOverlay";

/**
 * The moving part of a Reel or Short: the band under the clip, where the
 * glowing wave rises from the bottom over the first second and a half and then
 * keeps rolling, as the hero's wave and the stats video's do, with the wedgie's
 * number drawn over it. It is rendered frame by frame into its own video and
 * laid over the still template, so only this band ever changes.
 *
 * The wave settles as high up the band as the season is towards 50
 * wedgies, the same fill the hero and the stats video show: low early in the
 * season, the whole band at 50. Sizes are the templates' pixels; `top` is
 * just under the clip.
 */
export const WAVE_BANDS = {
  reel: {
    width: 1080,
    height: 1920,
    top: 1308,
    template: "reel-template.png",
  },
  short: {
    width: 2160,
    height: 3840,
    top: 2616,
    template: "shorts-template.png",
  },
} as const;

export type BandType = keyof typeof WAVE_BANDS;

const FPS = 30;
/** The season total that fills the band, as on the site's hero. */
const FULL_AT = 50;
const GLOW_STOPS: [number, string][] = [
  [0, "#5f84e6"],
  [0.5, "#7b6bf0"],
  [1, "#a65ff5"],
];
const LAYERS = [
  { colour: "rgba(95, 132, 230, 0.4)", lift: 0, speed: 70 },
  { colour: "rgba(166, 95, 245, 0.3)", lift: 14, speed: -55 },
  { colour: "rgba(123, 107, 240, 0.2)", lift: 24, speed: 40 },
];

const easeOutCubic = (x: number) =>
  1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

type Ctx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function wavePath(
  ctx: Ctx,
  width: number,
  bottom: number,
  baseY: number,
  amplitude: number,
  wavelength: number,
  offset: number,
) {
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  for (let x = 0; x <= width + 12; x += 12) {
    ctx.lineTo(
      x,
      baseY + Math.sin(((x + offset) / wavelength) * Math.PI * 2) * amplitude,
    );
  }
  ctx.lineTo(width, bottom);
  ctx.closePath();
}

/** The clip's box in each template: where it is scaled to and drawn. */
const CLIP = {
  reel: { width: 1080, height: 608, y: 700 },
  short: { width: 2160, height: 1216, y: 1400 },
} as const;

/**
 * Builds a Reel or Short in one ffmpeg pass: the clip, the still template,
 * and the wave band, whose raw frames are drawn here and piped straight in
 * (pipe:3), so the band is encoded once, with the final video. The wedgie's
 * text never moves, so it is drawn once and copied onto every frame.
 */
export async function composeWithWaveBand({
  type,
  data,
  inputPath,
  backgroundPath,
  outputPath,
}: {
  type: BandType;
  data: OverlayData;
  inputPath: string;
  backgroundPath: string;
  outputPath: string;
}) {
  const band = WAVE_BANDS[type];
  const clip = CLIP[type];
  const w = band.width;
  const h = band.height - band.top;
  const unit = w / 1080;
  const amplitude = 22 * unit;
  const wavelength = w * 0.55;
  const seconds = await probeSeconds(inputPath);

  // The night behind the wave: the template's row just above the band,
  // stretched down, so the band meets the still template without a seam.
  const template = await loadImage(
    path.join(process.cwd(), "public", band.template),
  );
  const night = createCanvas(w, h);
  night.getContext("2d").drawImage(template, 0, band.top - 1, w, 1, 0, 0, w, h);

  // The label, number and date, drawn once.
  const text = createCanvas(w, h);
  const textCtx = text.getContext("2d");
  textCtx.translate(0, -band.top);
  drawWedgieOverlay(textCtx, data, type);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const glow = ctx.createLinearGradient(0, 0, w, 0);
  for (const [stop, colour] of GLOW_STOPS) glow.addColorStop(stop, colour);

  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-i",
      inputPath,
      "-loop",
      "1",
      "-i",
      backgroundPath,
      "-f",
      "rawvideo",
      "-pix_fmt",
      "bgra",
      "-s",
      `${w}x${h}`,
      "-r",
      String(FPS),
      "-i",
      "pipe:3",
      "-filter_complex",
      [
        `[0:v]scale=${clip.width}:${clip.height}:force_original_aspect_ratio=decrease[scaled]`,
        `[scaled]pad=${clip.width}:${clip.height}:(ow-iw)/2:(oh-ih)/2[video]`,
        `[1:v][2:v]overlay=0:${band.top}:shortest=1[bg]`,
        `[bg][video]overlay=0:${clip.y}:shortest=1[out]`,
      ].join(";"),
      "-map",
      "[out]",
      "-map",
      "0:a?",
      "-c:a",
      "aac",
      "-c:v",
      "libx264",
      // The platforms re-encode on upload, so a faster preset at the
      // default quality only makes the file a little bigger.
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-y",
      outputPath,
    ],
    { stdio: ["ignore", "ignore", "pipe", "pipe"] },
  );
  const frameSink = ffmpeg.stdio[3] as Writable;
  let stderr = "";
  ffmpeg.stderr?.on("data", (d: Buffer) => {
    stderr = (stderr + d.toString()).slice(-4000);
  });
  const done = new Promise<void>((resolve, reject) => {
    ffmpeg.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`ffmpeg exited with ${code}: ${stderr.slice(-800)}`),
          ),
    );
    ffmpeg.on("error", reject);
  });
  // ffmpeg stops reading once the clip ends; that is not an error.
  frameSink.on("error", () => undefined);

  const level = Math.min(Math.max(data.number / FULL_AT, 0), 1);
  const settled = h - level * h + amplitude * 2;
  const frames = Math.max(1, Math.ceil(seconds * FPS));
  for (let i = 0; i < frames && !frameSink.destroyed; i++) {
    const t = i / FPS;
    ctx.drawImage(night, 0, 0);
    // Rises from below the bottom edge to the season's level, then keeps
    // rolling.
    const baseY =
      h + amplitude * 2 - (h + amplitude * 2 - settled) * easeOutCubic(t / 1.4);
    for (const layer of LAYERS) {
      wavePath(
        ctx,
        w,
        h,
        baseY - (36 - layer.lift) * unit,
        amplitude,
        wavelength,
        layer.speed * unit * t + layer.lift * 20,
      );
      ctx.fillStyle = layer.colour;
      ctx.fill();
    }
    wavePath(ctx, w, h, baseY, amplitude, wavelength, -90 * unit * t);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.drawImage(text, 0, 0);

    if (!frameSink.write(canvas.toBuffer("raw"))) {
      await new Promise<void>((r) => {
        frameSink.once("drain", () => r());
        frameSink.once("close", () => r());
      });
    }
  }
  frameSink.end();
  await done;
}

/** A clip's length in seconds, from ffprobe; 15 if it can't be read. */
export function probeSeconds(file: string) {
  return new Promise<number>((resolve) => {
    const probe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      file,
    ]);
    let out = "";
    probe.stdout.on("data", (d: Buffer) => (out += d.toString()));
    probe.on("close", () => {
      const s = parseFloat(out);
      resolve(Number.isFinite(s) && s > 0 ? s : 15);
    });
    probe.on("error", () => resolve(15));
  });
}
