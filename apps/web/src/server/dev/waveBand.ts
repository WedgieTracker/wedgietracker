import { spawn } from "child_process";
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
 * Sizes are the templates' pixels. `top` is just under the clip; `crest` is
 * where the wave settles, where the template's own wave sits.
 */
export const WAVE_BANDS = {
  reel: {
    width: 1080,
    height: 1920,
    top: 1308,
    crest: 1372,
    template: "reel-template.png",
  },
  short: {
    width: 2160,
    height: 3840,
    top: 2616,
    crest: 2728,
    template: "shorts-template.png",
  },
} as const;

export type BandType = keyof typeof WAVE_BANDS;

const FPS = 30;
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

/** Renders the band for `seconds` into an H.264 file at `outPath`. */
export async function renderWaveBand(
  type: BandType,
  data: OverlayData,
  seconds: number,
  outPath: string,
) {
  const band = WAVE_BANDS[type];
  const w = band.width;
  const h = band.height - band.top;
  const unit = w / 1080;
  const amplitude = 22 * unit;
  const wavelength = w * 0.55;

  // The night behind the wave: the template's row just above the band,
  // stretched down, so the band meets the still template without a seam.
  const template = await loadImage(
    path.join(process.cwd(), "public", band.template),
  );
  const night = createCanvas(w, h);
  night.getContext("2d").drawImage(template, 0, band.top - 1, w, 1, 0, 0, w, h);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const glow = ctx.createLinearGradient(0, 0, w, 0);
  for (const [stop, colour] of GLOW_STOPS) glow.addColorStop(stop, colour);

  const ffmpeg = spawn("ffmpeg", [
    "-f",
    "rawvideo",
    "-pix_fmt",
    "bgra",
    "-s",
    `${w}x${h}`,
    "-r",
    String(FPS),
    "-i",
    "-",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-pix_fmt",
    "yuv420p",
    "-y",
    outPath,
  ]);
  const done = new Promise<void>((resolve, reject) => {
    ffmpeg.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`wave band ffmpeg exited with ${code}`)),
    );
    ffmpeg.on("error", reject);
  });
  ffmpeg.stderr.resume();

  const frames = Math.max(1, Math.ceil(seconds * FPS));
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    ctx.drawImage(night, 0, 0);
    // Rises from below the bottom edge to its crest, then keeps rolling.
    const settled = band.crest - band.top;
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

    ctx.save();
    ctx.translate(0, -band.top);
    drawWedgieOverlay(ctx, data, type);
    ctx.restore();

    const frame = canvas.toBuffer("raw");
    if (!ffmpeg.stdin.write(frame)) {
      await new Promise<void>((r) => ffmpeg.stdin.once("drain", () => r()));
    }
  }
  ffmpeg.stdin.end();
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
