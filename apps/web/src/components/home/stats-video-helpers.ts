export interface ShareableStats {
  totalWedgies: number;
  currentPace: number;
  gamesPlayed: number;
  previousRecord: number;
  previousRecordSeason?: string | null;
  lastWedgie: Date | string | null;
  liveGames: boolean;
}

/**
 * The two shapes we export. Portrait is 1080x1920, the size Reels, Shorts and
 * TikTok expect; landscape is 1080p for YouTube and X.
 */
export type VideoFormat = "portrait" | "landscape";

export const VIDEO_FORMATS: Record<
  VideoFormat,
  { width: number; height: number; suffix: string }
> = {
  portrait: { width: 1080, height: 1920, suffix: "vertical" },
  landscape: { width: 1920, height: 1080, suffix: "landscape" },
};

export const VIDEO_FPS = 30;
export const VIDEO_DURATION_S = 10;
/** Variable bitrate ceiling. Flat colour and a still grain sit well under it. */
export const VIDEO_BITRATE = 6_000_000;
/** The season total that fills the hero's wave to the top. */
export const WAVE_FULL_AT = 50;

/**
 * MediaRecorder fallbacks, best first. MP4 with H.264 is what phones and the
 * social apps take; WebM is a last resort for browsers that can do nothing
 * else. No audio codec is listed because the video has no sound.
 */
export const RECORDER_MIME_TYPES = [
  'video/mp4;codecs="avc1.640028"',
  'video/mp4;codecs="avc1.42E028"',
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;

export function pickSupportedMimeType(
  isSupported: (mime: string) => boolean,
): string | undefined {
  return RECORDER_MIME_TYPES.find(isSupported);
}

export function pickFileExtension(mimeType: string): "webm" | "mp4" {
  return mimeType.includes("webm") ? "webm" : "mp4";
}

export function buildVideoFilename(
  today: Date,
  extension: "webm" | "mp4",
  format?: VideoFormat,
): string {
  const dateString = today.toISOString().split("T")[0];
  const suffix = format ? `-${VIDEO_FORMATS[format].suffix}` : "";
  return `WedgieTracker-${dateString}${suffix}.${extension}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type EncodingMethod = "webcodecs" | "recorder";

/**
 * WebCodecs renders frame by frame as fast as the machine allows and writes a
 * proper MP4. MediaRecorder records in real time, so it is only used when
 * the browser cannot encode H.264 with WebCodecs.
 */
export function pickEncodingMethod(options: {
  canUseWebCodecs: boolean;
  recorderMimeType: string | undefined;
}): EncodingMethod | null {
  if (options.canUseWebCodecs) return "webcodecs";
  if (options.recorderMimeType) return "recorder";
  return null;
}

/** Days since the last wedgie, counted the same way as the calendar on the page. */
export function getWedgieDays(
  lastWedgie: Date | string | null,
  now: Date = new Date(),
) {
  if (!lastWedgie) return { daysWithoutWedgie: 0, hasNewWedgie: false };
  const elapsedMs = now.getTime() - new Date(lastWedgie).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return {
    daysWithoutWedgie: Math.max(0, Math.ceil(elapsedDays) - 1),
    hasNewWedgie: elapsedDays < 1,
  };
}

export function pickStatusText(totalWedgies: number, previousRecord: number) {
  if (totalWedgies > previousRecord) return "NEW ALL-TIME RECORD";
  if (totalWedgies === previousRecord) return "ALL-TIME RECORD TIED";
  return "WE'RE AT";
}

/** How full the wave is, 0 to 1, for a season total. */
export function fillLevel(totalWedgies: number): number {
  return Math.min(Math.max(totalWedgies / WAVE_FULL_AT, 0), 1);
}

/** How far along the pace arc is, 0 to 1, where the far end is the record. */
export function paceFraction(pace: number, record: number): number {
  const max = Math.max(record, pace, 1);
  return Math.min(Math.max(pace / max, 0), 1);
}

// ---------------------------------------------------------------------------
// Timeline. Every frame is a pure function of its time in seconds, so the
// video looks the same however fast or slow the machine draws it.
// ---------------------------------------------------------------------------

export function frameCount(
  durationS = VIDEO_DURATION_S,
  fps = VIDEO_FPS,
): number {
  return Math.round(durationS * fps);
}

export function frameTime(index: number, fps = VIDEO_FPS): number {
  return index / fps;
}

export function clamp01(x: number): number {
  return Math.min(Math.max(x, 0), 1);
}

export function easeOutCubic(x: number): number {
  const t = clamp01(x);
  return 1 - Math.pow(1 - t, 3);
}

/** A small overshoot, for things that pop in. */
export function easeOutBack(x: number): number {
  const t = clamp01(x);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** 0 before `start`, 1 after `start + duration`, linear in between. */
export function phase(t: number, start: number, duration: number): number {
  if (duration <= 0) return t >= start ? 1 : 0;
  return clamp01((t - start) / duration);
}

/** A count that eases up to `value`, landing exactly on it. */
export function countUp(
  value: number,
  t: number,
  start: number,
  duration: number,
): number {
  return Math.round(value * easeOutCubic(phase(t, start, duration)));
}

/** Small deterministic random generator, so confetti and grain repeat exactly. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  color: string;
}

export const CONFETTI_COLORS = [
  "#f0e1b6",
  "#9a5cf5",
  "#5f84e6",
  "#ff4fc8",
  "#f7e8c7",
] as const;

export function createConfetti(
  count: number,
  width: number,
  height: number,
  seed = 1,
): ConfettiPiece[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    vx: (random() - 0.5) * 120,
    vy: 140 + random() * 220,
    size: 10 + random() * 14,
    spin: (random() - 0.5) * 8,
    color: CONFETTI_COLORS[Math.floor(random() * CONFETTI_COLORS.length)]!,
  }));
}

/** Where a piece is at time `t`: it falls and drifts, wrapping round the frame. */
export function confettiPosition(
  piece: ConfettiPiece,
  t: number,
  width: number,
  height: number,
) {
  const margin = piece.size * 2;
  const wrap = (v: number, span: number) => ((v % span) + span) % span;
  return {
    x: wrap(piece.x + piece.vx * t + margin, width + margin * 2) - margin,
    y: wrap(piece.y + piece.vy * t + margin, height + margin * 2) - margin,
    angle: piece.spin * t,
  };
}
