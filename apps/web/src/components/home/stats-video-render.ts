import {
  type EncodingMethod,
  type ShareableStats,
  type VideoFormat,
  VIDEO_BITRATE,
  VIDEO_DURATION_S,
  VIDEO_FORMATS,
  VIDEO_FPS,
  frameCount,
  frameTime,
  pickEncodingMethod,
  pickSupportedMimeType,
} from "./stats-video-helpers";
import {
  type Scene,
  createScene,
  drawStatsFrame,
  loadLogo,
  loadVideoFonts,
} from "./stats-video-canvas";

/*
  Turns the stats into a video file.

  The main path draws each frame at a fixed time step and hands it to the
  browser's H.264 encoder through WebCodecs, then writes an MP4 with the index
  at the front (what iPhones and the upload forms of Reels, Shorts and TikTok
  want). It runs as fast as the machine can draw, does not drop frames, and
  keeps going in a background tab.

  Browsers without H.264 in WebCodecs fall back to MediaRecorder, which can
  only record in real time.
*/

export interface RenderResult {
  blob: Blob;
  mimeType: string;
  method: EncodingMethod;
  renderMs: number;
}

export class VideoUnsupportedError extends Error {
  constructor() {
    super("This browser cannot record video");
    this.name = "VideoUnsupportedError";
  }
}

const LOGO_URL = "/logo.svg";

function abortError() {
  return new DOMException("Video generation cancelled", "AbortError");
}

/**
 * Lets the page breathe between frames. A message channel is used instead of
 * setTimeout because background tabs slow timers down to once a second.
 */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function canEncodeWithWebCodecs(format: VideoFormat): Promise<boolean> {
  if (typeof VideoEncoder === "undefined") return false;
  try {
    const { canEncodeVideo, Quality } = await import("mediabunny");
    const { width, height } = VIDEO_FORMATS[format];
    return await canEncodeVideo("avc", {
      width,
      height,
      frameRate: VIDEO_FPS,
      quality: new Quality({ bitrate: VIDEO_BITRATE }),
    });
  } catch {
    return false;
  }
}

function recorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return pickSupportedMimeType((m) => MediaRecorder.isTypeSupported(m));
}

async function encodeWithWebCodecs(
  canvas: HTMLCanvasElement,
  scene: Scene,
  signal: AbortSignal,
  onProgress: (fraction: number) => void,
): Promise<Blob> {
  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality } =
    await import("mediabunny");
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, {
    codec: "avc",
    quality: new Quality({ bitrate: VIDEO_BITRATE }),
    keyFrameInterval: 2,
    latencyMode: "quality",
  });
  output.addVideoTrack(source, { frameRate: VIDEO_FPS });

  try {
    await output.start();
    const frames = frameCount();
    const step = 1 / VIDEO_FPS;
    for (let i = 0; i < frames; i++) {
      if (signal.aborted) throw abortError();
      drawStatsFrame(scene, frameTime(i));
      await source.add(frameTime(i), step);
      onProgress((i + 1) / frames);
      if (i % 3 === 0) await yieldToBrowser();
    }
    await output.finalize();
  } catch (error) {
    if (output.state !== "finalized" && output.state !== "canceled") {
      await output.cancel().catch(() => undefined);
    }
    throw error;
  }

  const buffer = output.target.buffer;
  if (!buffer) throw new Error("The encoder produced no data");
  return new Blob([buffer], { type: "video/mp4" });
}

async function encodeWithRecorder(
  canvas: HTMLCanvasElement,
  scene: Scene,
  mimeType: string,
  signal: AbortSignal,
  onProgress: (fraction: number) => void,
): Promise<Blob> {
  // Paint the first frame before recording, so the video never opens blank.
  drawStatsFrame(scene, 0);
  const stream = canvas.captureStream(VIDEO_FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: VIDEO_BITRATE,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = () => reject(new Error("The recorder failed"));
  });

  recorder.start(1000);
  const startedAt = performance.now();
  try {
    // Real time is all MediaRecorder understands. Each frame is drawn for
    // the time that has really passed, so a slow machine drops frames but
    // the video still runs at the right speed.
    for (;;) {
      if (signal.aborted) throw abortError();
      const t = (performance.now() - startedAt) / 1000;
      if (t >= VIDEO_DURATION_S) break;
      drawStatsFrame(scene, t);
      onProgress(t / VIDEO_DURATION_S);
      await wait(1000 / VIDEO_FPS);
    }
  } finally {
    if (recorder.state !== "inactive") recorder.stop();
    for (const track of stream.getTracks()) track.stop();
  }
  await stopped;
  onProgress(1);
  return new Blob(chunks, { type: mimeType });
}

export async function renderStatsVideo({
  stats,
  format,
  signal,
  onProgress,
  now = new Date(),
}: {
  stats: ShareableStats;
  format: VideoFormat;
  signal: AbortSignal;
  onProgress: (fraction: number) => void;
  now?: Date;
}): Promise<RenderResult> {
  const startedAt = performance.now();
  const [webCodecs, , logo] = await Promise.all([
    canEncodeWithWebCodecs(format),
    loadVideoFonts(),
    loadLogo(LOGO_URL, signal),
  ]);
  if (signal.aborted) throw abortError();

  const mime = recorderMimeType();
  const method = pickEncodingMethod({
    canUseWebCodecs: webCodecs,
    recorderMimeType: mime,
  });
  if (!method) throw new VideoUnsupportedError();

  const { width, height } = VIDEO_FORMATS[format];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new VideoUnsupportedError();

  const scene = createScene(
    ctx,
    format,
    stats,
    { logo: logo?.image ?? null, logoAspect: logo?.aspect ?? 200 / 63 },
    now,
  );

  try {
    const blob =
      method === "webcodecs"
        ? await encodeWithWebCodecs(canvas, scene, signal, onProgress)
        : await encodeWithRecorder(canvas, scene, mime!, signal, onProgress);
    return {
      blob,
      mimeType: blob.type,
      method,
      renderMs: performance.now() - startedAt,
    };
  } finally {
    // Canvases hold their pixels until they are shrunk; Safari in particular
    // counts them against a small budget.
    canvas.width = 0;
    canvas.height = 0;
    if (scene.background instanceof HTMLCanvasElement) {
      scene.background.width = 0;
      scene.background.height = 0;
    }
  }
}
