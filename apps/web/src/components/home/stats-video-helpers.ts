export interface WaveLayer {
  speedMultiplier: number;
  yOffset: number;
  opacity: number;
  phase: number;
}

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  gravity: number;
  drag: number;
}

export interface ShareableStats {
  totalWedgies: number;
  currentPace: number;
  gamesPlayed: number;
  previousRecord: number;
  lastWedgie: Date | string | null;
  liveGames: boolean;
}

export const RECORDER_MIME_TYPES = [
  'video/mp4;codecs="avc1.424028, mp4a.40.2"',
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;

export const CONFETTI_COLORS = [
  "#eaff00",
  "#ff03ff",
  "#180138",
  "#542299",
  "#efff40",
] as const;

export const INITIAL_WAVE_LAYERS: WaveLayer[] = [
  { speedMultiplier: 0.25, yOffset: -15, opacity: 0.3, phase: 0 },
  { speedMultiplier: 0.3, yOffset: -10, opacity: 0.5, phase: Math.PI / 2 },
  { speedMultiplier: 0.35, yOffset: 10, opacity: 0.7, phase: Math.PI },
  { speedMultiplier: 0.4, yOffset: 0, opacity: 1.0, phase: (3 * Math.PI) / 2 },
];

export function getWedgieDays(lastWedgie: Date | string | null) {
  if (!lastWedgie) return { daysWithoutWedgie: 0, hasNewWedgie: false };
  const elapsedMs = new Date().getTime() - new Date(lastWedgie).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return {
    daysWithoutWedgie: Math.ceil(elapsedDays) - 1,
    hasNewWedgie: elapsedDays < 1,
  };
}

export function pickStatusText(totalWedgies: number, previousRecord: number) {
  if (totalWedgies > previousRecord) return "NEW ALL-TIME RECORD";
  if (totalWedgies === previousRecord) return "ALL-TIME RECORD TIED";
  return "WE'RE AT";
}

export function pickFileExtension(mimeType: string): "webm" | "mp4" {
  return mimeType.includes("webm") ? "webm" : "mp4";
}

export function pickSupportedMimeType(
  isSupported: (mime: string) => boolean,
): string | undefined {
  return RECORDER_MIME_TYPES.find(isSupported);
}

export function buildVideoFilename(
  today: Date,
  extension: "webm" | "mp4",
): string {
  const dateString = today.toISOString().split("T")[0];
  return `WedgieTracker-${dateString}.${extension}`;
}
