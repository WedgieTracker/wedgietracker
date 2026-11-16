import { spawn } from "child_process";
import type { Readable, Writable } from "stream";
import fs from "fs";
import os from "os";
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
/**
 * Takes whole frames off a worker's stdout. It holds at most two frames
 * ahead (a 4K band frame is about 10 MB), pausing the worker until the
 * parent catches up.
 */
class FrameReader {
  private chunks: Buffer[] = [];
  private size = 0;
  private ended = false;
  private waiting: (() => void) | null = null;

  constructor(
    private stream: Readable,
    private frameBytes: number,
  ) {
    stream.on("data", (chunk: Buffer) => {
      this.chunks.push(chunk);
      this.size += chunk.length;
      if (this.size >= this.frameBytes * 2) stream.pause();
      this.wake();
    });
    stream.on("end", () => {
      this.ended = true;
      this.wake();
    });
  }

  private wake() {
    const w = this.waiting;
    this.waiting = null;
    w?.();
  }

  async next(): Promise<Buffer | null> {
    while (this.size < this.frameBytes) {
      if (this.ended) return null;
      await new Promise<void>((r) => (this.waiting = r));
    }
    const all = Buffer.concat(this.chunks, this.size);
    const frame = all.subarray(0, this.frameBytes);
    const rest = all.subarray(this.frameBytes);
    this.chunks = rest.length ? [rest] : [];
    this.size = rest.length;
    if (this.size < this.frameBytes * 2) this.stream.resume();
    return frame;
  }

  stop() {
    this.stream.destroy();
  }
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

  // The night and the text go to the workers as images.
  const stamp = `${Date.now()}_${process.pid}`;
  const nightPath = path.join(os.tmpdir(), `band_night_${stamp}.png`);
  const textPath = path.join(os.tmpdir(), `band_text_${stamp}.png`);
  await fs.promises.writeFile(nightPath, night.toBuffer("image/png"));
  await fs.promises.writeFile(textPath, text.toBuffer("image/png"));

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
      // The overlays run at 4K for a Short; let them use every core.
      "-filter_complex_threads",
      process.env.WT_FILTER_THREADS ?? String(os.availableParallelism()),
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
      // The platforms re-encode on upload, so a faster preset with a lower
      // CRF keeps the look and only makes the file bigger. Both can be
      // tuned per machine (a Raspberry Pi wants the fastest preset).
      "-preset",
      process.env.WT_X264_PRESET ?? "veryfast",
      "-crf",
      process.env.WT_X264_CRF ?? "23",
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

  // Frames are drawn by worker processes, round-robin, on the free cores;
  // ffmpeg needs at least one of the rest.
  const level = Math.min(Math.max(data.number / FULL_AT, 0), 1);
  const settled = h - level * h + amplitude * 2;
  const frames = Math.max(1, Math.ceil(seconds * FPS));
  const workerCount = Math.max(
    1,
    Math.min(
      Number(process.env.WT_BAND_WORKERS) || os.availableParallelism() - 1,
      4,
      frames,
    ),
  );
  const workerScript = path.join(
    process.cwd(),
    "src/server/dev/waveBandWorker.mjs",
  );
  const frameBytes = w * h * 4;
  const readers = Array.from({ length: workerCount }, (_, start) => {
    const job = {
      w,
      h,
      fps: FPS,
      frames,
      start,
      step: workerCount,
      settled,
      nightPath,
      textPath,
    };
    const child = spawn(process.execPath, [workerScript, JSON.stringify(job)], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    return new FrameReader(child.stdout, frameBytes);
  });

  try {
    for (let i = 0; i < frames && !frameSink.destroyed; i++) {
      const frame = await readers[i % workerCount]!.next();
      if (!frame) throw new Error(`wave band worker stopped at frame ${i}`);
      if (!frameSink.write(frame)) {
        await new Promise<void>((r) => {
          frameSink.once("drain", () => r());
          frameSink.once("close", () => r());
        });
      }
    }
  } finally {
    for (const reader of readers) reader.stop();
    await fs.promises.unlink(nightPath).catch(() => undefined);
    await fs.promises.unlink(textPath).catch(() => undefined);
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
