import {
  type ConfettiPiece,
  type ShareableStats,
  type VideoFormat,
  confettiPosition,
  countUp,
  createConfetti,
  easeOutBack,
  easeOutCubic,
  fillLevel,
  getWedgieDays,
  paceFraction,
  phase,
  pickStatusText,
  seededRandom,
} from "./stats-video-helpers";

/*
  Draws one frame of the stats video. Everything on screen is worked out from
  the frame's time, so a frame can be drawn in any order, at any speed, and
  always comes out the same.

  The look follows the No Dunks badge on the home page: the blue-to-purple
  gradient with film grain, the glowing wave, cream numbers in heavy italic
  with a dark drop, and the cream sticker for the address.
*/

const NIGHT = "#140A2E";
const PANEL = "#1D1242";
const CREAM = "#F0E1B6";
const VIOLET = "#9A5CF5";
const INK = "#2A1660";
const DROP = "#2a1a5c";
const FONT = `Inter, "Inter Fallback", system-ui, sans-serif`;
const BADGE_STOPS: [number, string][] = [
  [0, "#4769c5"],
  [0.22, "#3650a1"],
  [0.45, "#36378d"],
  [0.75, "#441c77"],
  [1, "#502394"],
];
const GLOW_STOPS: [number, string][] = [
  [0, "#5f84e6"],
  [0.5, "#7b6bf0"],
  [1, "#a65ff5"],
];
/** The slant of the italic numbers, done by hand so every browser draws it alike. */
const ITALIC_SKEW = -0.2;

export interface SceneAssets {
  logo: CanvasImageSource | null;
  logoAspect: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  logo: { cx: number; y: number; w: number };
  date: { cx: number; y: number; size: number };
  hero: Box;
  pace: Box;
  calendar: Box;
  footer: { cx: number; y: number; size: number };
}

const LAYOUTS: Record<VideoFormat, Layout> = {
  portrait: {
    logo: { cx: 540, y: 150, w: 440 },
    date: { cx: 540, y: 345, size: 34 },
    hero: { x: 110, y: 420, w: 860, h: 780 },
    pace: { x: 110, y: 1270, w: 470, h: 400 },
    calendar: { x: 640, y: 1270, w: 330, h: 400 },
    footer: { cx: 540, y: 1760, size: 44 },
  },
  landscape: {
    logo: { cx: 960, y: 56, w: 300 },
    date: { cx: 960, y: 200, size: 26 },
    hero: { x: 640, y: 250, w: 640, h: 600 },
    pace: { x: 150, y: 370, w: 420, h: 360 },
    calendar: { x: 1400, y: 370, w: 300, h: 360 },
    footer: { cx: 960, y: 930, size: 34 },
  },
};

export interface Scene {
  ctx: CanvasRenderingContext2D;
  format: VideoFormat;
  width: number;
  height: number;
  stats: ShareableStats;
  assets: SceneAssets;
  now: Date;
  background: CanvasImageSource;
  confetti: ConfettiPiece[];
  celebrate: boolean;
}

function font(weight: number, size: number) {
  return `${weight} ${Math.round(size)}px ${FONT}`;
}

/**
 * The gradient and grain never change, so they are painted once onto their
 * own canvas and copied in each frame. That keeps every frame cheap and gives
 * the encoder a background that does not move.
 */
function paintBackground(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // A CSS 150deg gradient runs from top left to bottom right.
  const angle = (150 * Math.PI) / 180;
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
  const gradient = ctx.createLinearGradient(
    width / 2 - dx * half,
    height / 2 - dy * half,
    width / 2 + dx * half,
    height / 2 + dy * half,
  );
  for (const [stop, colour] of BADGE_STOPS) gradient.addColorStop(stop, colour);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Film grain: grey noise laid over with soft light, like the badge's ::after.
  const tile = document.createElement("canvas");
  tile.width = 256;
  tile.height = 256;
  const tctx = tile.getContext("2d")!;
  const noise = tctx.createImageData(256, 256);
  const random = seededRandom(7);
  for (let i = 0; i < noise.data.length; i += 4) {
    const v = Math.floor(random() * 255);
    noise.data[i] = v;
    noise.data[i + 1] = v;
    noise.data[i + 2] = v;
    noise.data[i + 3] = 255;
  }
  tctx.putImageData(noise, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  return canvas;
}

export function createScene(
  ctx: CanvasRenderingContext2D,
  format: VideoFormat,
  stats: ShareableStats,
  assets: SceneAssets,
  now = new Date(),
): Scene {
  const { width, height } = ctx.canvas;
  const celebrate =
    fillLevel(stats.totalWedgies) >= 1 ||
    stats.totalWedgies >= stats.previousRecord;
  return {
    ctx,
    format,
    width,
    height,
    stats,
    assets,
    now,
    background: paintBackground(width, height),
    confetti: celebrate ? createConfetti(140, width, height) : [],
    celebrate,
  };
}

function horizontalGlow(ctx: CanvasRenderingContext2D, width: number) {
  const g = ctx.createLinearGradient(0, 0, width, 0);
  for (const [stop, colour] of GLOW_STOPS) g.addColorStop(stop, colour);
  return g;
}

function wavePath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseY: number,
  amplitude: number,
  wavelength: number,
  offset: number,
) {
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 12; x += 12) {
    const y =
      baseY + Math.sin(((x + offset) / wavelength) * Math.PI * 2) * amplitude;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
}

/** The glowing wave from the hero, risen to how far the season is towards 50. */
function drawWave(scene: Scene, t: number) {
  const { ctx, width, height } = scene;
  const level = fillLevel(scene.stats.totalWedgies) * easeOutCubic(t / 1.4);
  if (level <= 0) return;
  const unit = Math.min(width, height) / 1080;
  const amplitude = 22 * unit;
  const baseY = height - level * height + amplitude * 2;
  const wavelength = width * 0.55;
  const layers = [
    { colour: "rgb(95 132 230 / 0.4)", lift: 0, speed: 70 },
    { colour: "rgb(166 95 245 / 0.3)", lift: 14, speed: -55 },
    { colour: "rgb(123 107 240 / 0.2)", lift: 24, speed: 40 },
  ];
  for (const layer of layers) {
    wavePath(
      ctx,
      width,
      height,
      baseY - (36 - layer.lift) * unit,
      amplitude,
      wavelength,
      layer.speed * unit * t + layer.lift * 20,
    );
    ctx.fillStyle = layer.colour;
    ctx.fill();
  }
  wavePath(ctx, width, height, baseY, amplitude, wavelength, -90 * unit * t);
  ctx.fillStyle = horizontalGlow(ctx, width);
  ctx.fill();
}

function drawConfetti(scene: Scene, t: number) {
  if (!scene.celebrate) return;
  const { ctx, width, height } = scene;
  const appear = phase(t, 2.2, 0.6);
  if (appear <= 0) return;
  ctx.save();
  ctx.globalAlpha = appear;
  for (const piece of scene.confetti) {
    const p = confettiPosition(piece, t - 2.2, width, height);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
    ctx.restore();
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, box: Box, radius: number) {
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, radius);
}

/** Fades and lifts a block into place over `duration` seconds from `start`. */
function enter(
  ctx: CanvasRenderingContext2D,
  t: number,
  start: number,
  duration: number,
  box: Box,
  { lift = 40, pop = false } = {},
): boolean {
  const p = phase(t, start, duration);
  if (p <= 0) return false;
  ctx.globalAlpha = easeOutCubic(p);
  if (pop) {
    const s = 0.9 + 0.1 * easeOutBack(p);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
  } else {
    ctx.translate(0, (1 - easeOutCubic(p)) * lift);
  }
  return true;
}

/** Largest size up to `max` at which `text` fits in `maxWidth`. */
function fitSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  max: number,
  maxWidth: number,
) {
  ctx.font = font(weight, max);
  const width = ctx.measureText(text).width * (1 + Math.abs(ITALIC_SKEW) / 2);
  return width > maxWidth ? Math.floor((max * maxWidth) / width) : max;
}

/**
 * Cream lettering with the badge's dark drop: a soft shadow, then a hard
 * copy a little lower in deep purple, then the cream on top.
 */
function badgeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  { italic = false, weight = 900, colour = CREAM } = {},
) {
  ctx.save();
  ctx.font = font(weight, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if (italic) {
    ctx.translate(x, y);
    ctx.transform(1, 0, ITALIC_SKEW, 1, 0, 0);
    ctx.translate(-x, -y);
  }
  ctx.shadowColor = "rgb(10 5 30 / 0.45)";
  ctx.shadowOffsetY = size * 0.08;
  ctx.shadowBlur = size * 0.14;
  ctx.fillStyle = DROP;
  ctx.fillText(text, x, y + size * 0.04);
  ctx.shadowColor = "transparent";
  ctx.fillText(text, x, y + size * 0.04);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLogo(scene: Scene, layout: Layout, t: number) {
  const { ctx, assets } = scene;
  const { logo, date } = layout;
  const h = logo.w / assets.logoAspect;
  ctx.save();
  if (enter(ctx, t, 0, 0.6, { x: 0, y: logo.y, w: 0, h }, { lift: -30 })) {
    if (assets.logo) {
      ctx.drawImage(assets.logo, logo.cx - logo.w / 2, logo.y, logo.w, h);
    } else {
      badgeText(ctx, "WEDGIETRACKER", logo.cx, logo.y + h * 0.7, h * 0.5);
    }
    ctx.font = font(800, date.size);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgb(240 225 182 / 0.75)";
    const label = scene.now
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
    ctx.fillText(label, date.cx, date.y);
  }
  ctx.restore();
}

function drawHero(scene: Scene, layout: Layout, t: number) {
  const { ctx, stats } = scene;
  const box = layout.hero;
  ctx.save();
  if (enter(ctx, t, 0.15, 0.6, box, { pop: true })) {
    roundRect(ctx, box, box.w * 0.05);
    ctx.fillStyle = "rgb(29 18 66 / 0.5)";
    ctx.fill();

    const cx = box.x + box.w / 2;
    const status = pickStatusText(stats.totalWedgies, stats.previousRecord);
    ctx.font = font(800, box.w * 0.058);
    ctx.textAlign = "center";
    ctx.fillStyle = CREAM;
    ctx.fillText(status, cx, box.y + box.h * 0.12);

    const total = countUp(stats.totalWedgies, t, 0.35, 1.6);
    const finalText = stats.totalWedgies.toLocaleString("en-US");
    const size = fitSize(ctx, finalText, 900, box.h * 0.62, box.w * 0.86);
    badgeText(
      ctx,
      total.toLocaleString("en-US"),
      cx - size * 0.03,
      box.y + box.h * 0.66,
      size,
      { italic: true },
    );
    badgeText(ctx, "WEDGIES", cx, box.y + box.h * 0.9, box.w * 0.15);
  }
  ctx.restore();
}

function drawPace(scene: Scene, layout: Layout, t: number) {
  const { ctx, stats } = scene;
  const box = layout.pace;
  const showPace = stats.currentPace !== stats.totalWedgies;
  ctx.save();
  if (enter(ctx, t, 1.4, 0.6, box)) {
    roundRect(ctx, box, box.w * 0.06);
    ctx.fillStyle = PANEL;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgb(154 92 245 / 0.2)";
    ctx.stroke();

    const cx = box.x + box.w / 2;
    if (showPace) {
      // The arc from PaceGauge: half a circle that ends at the record.
      const r = box.w * 0.36;
      const cy = box.y + box.h * 0.66;
      const stroke = box.w * 0.075;
      ctx.lineCap = "round";
      ctx.lineWidth = stroke;
      ctx.strokeStyle = "rgb(154 92 245 / 0.18)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 0);
      ctx.stroke();
      const sweep =
        paceFraction(stats.currentPace, stats.previousRecord) *
        easeOutCubic(phase(t, 1.7, 1.4));
      if (sweep > 0) {
        const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
        g.addColorStop(0, "#5f84e6");
        g.addColorStop(1, "#a65ff5");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * sweep);
        ctx.stroke();
      }
      ctx.font = font(700, box.w * 0.06);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgb(240 225 182 / 0.7)";
      ctx.fillText("On pace for", cx, cy - r * 0.62);
      const pace = countUp(stats.currentPace, t, 1.7, 1.4);
      const paceSize = fitSize(
        ctx,
        String(stats.currentPace),
        900,
        r * 0.6,
        r * 1.4,
      );
      badgeText(ctx, pace.toString(), cx, cy, paceSize, { italic: true });

      ctx.font = font(800, box.w * 0.05);
      ctx.fillStyle = "rgb(240 225 182 / 0.55)";
      ctx.fillText("0", cx - r, cy + box.h * 0.17);
      ctx.fillStyle = CREAM;
      ctx.fillText(
        `Record ${stats.previousRecord}`,
        cx + r * 0.75,
        cy + box.h * 0.17,
      );
    } else {
      // Before the pace means anything, the page shows games played instead.
      const games = countUp(stats.gamesPlayed, t, 1.7, 1.4);
      const size = fitSize(
        ctx,
        stats.gamesPlayed.toLocaleString("en-US"),
        900,
        box.h * 0.42,
        box.w * 0.8,
      );
      badgeText(
        ctx,
        games.toLocaleString("en-US"),
        cx,
        box.y + box.h * 0.58,
        size,
        { italic: true },
      );
      ctx.font = font(700, box.w * 0.07);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgb(240 225 182 / 0.7)";
      ctx.fillText("games played", cx, box.y + box.h * 0.8);
    }
  }
  ctx.restore();
}

/** The circle drawn round NEW WEDGIE on the calendar, drawn on over time. */
function circleAround(
  ctx: CanvasRenderingContext2D,
  box: Box,
  progress: number,
) {
  if (progress <= 0) return;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const rx = box.w * 0.46;
  const ry = box.h * 0.4;
  const start = -Math.PI * 0.45;
  ctx.save();
  ctx.lineWidth = box.w * 0.025;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#ff4fc8";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, -0.05, start, start + Math.PI * 2.1 * progress);
  ctx.stroke();
  ctx.restore();
}

function drawCalendar(scene: Scene, layout: Layout, t: number) {
  const { ctx, stats } = scene;
  const box = layout.calendar;
  if (!stats.lastWedgie) return;
  const { daysWithoutWedgie, hasNewWedgie } = getWedgieDays(
    stats.lastWedgie,
    scene.now,
  );
  ctx.save();
  if (enter(ctx, t, 1.7, 0.6, box)) {
    const radius = box.w * 0.08;
    const header = box.h * 0.16;
    ctx.save();
    ctx.shadowColor = "rgb(5 2 20 / 0.45)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 16;
    roundRect(ctx, box, radius);
    ctx.fillStyle = CREAM;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, box, radius);
    ctx.clip();
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y);
    for (const [stop, colour] of GLOW_STOPS) g.addColorStop(stop, colour);
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, header);
    ctx.restore();

    // The two rings at the top of a tear-off page.
    ctx.fillStyle = CREAM;
    for (const fx of [0.22, 0.78]) {
      ctx.beginPath();
      ctx.roundRect(
        box.x + box.w * fx - box.w * 0.03,
        box.y - box.h * 0.03,
        box.w * 0.06,
        header * 0.75,
        6,
      );
      ctx.fill();
    }

    const body: Box = {
      x: box.x,
      y: box.y + header,
      w: box.w,
      h: box.h - header,
    };
    const cx = body.x + body.w / 2;
    ctx.textAlign = "center";
    if (hasNewWedgie) {
      circleAround(
        ctx,
        { ...body, x: body.x + 12, w: body.w - 24 },
        easeOutCubic(phase(t, 2.3, 0.9)),
      );
      const size = fitSize(ctx, "WEDGIE", 900, body.w * 0.22, body.w * 0.72);
      ctx.font = font(900, size);
      ctx.fillStyle = "#e0359f";
      ctx.fillText("NEW", cx, body.y + body.h * 0.47);
      ctx.fillStyle = "#502394";
      ctx.fillText("WEDGIE", cx, body.y + body.h * 0.47 + size * 0.95);
    } else {
      const days = countUp(daysWithoutWedgie, t, 1.9, 1);
      const size = fitSize(
        ctx,
        String(daysWithoutWedgie),
        900,
        body.h * 0.5,
        body.w * 0.8,
      );
      ctx.save();
      const y = body.y + body.h * 0.58;
      ctx.translate(cx, y);
      ctx.transform(1, 0, ITALIC_SKEW, 1, 0, 0);
      ctx.font = font(900, size);
      ctx.fillStyle = "#502394";
      ctx.fillText(String(days), 0, 0);
      ctx.restore();
      ctx.font = font(900, body.w * 0.085);
      ctx.fillStyle = NIGHT;
      ctx.fillText(
        `${daysWithoutWedgie === 1 ? "day" : "days"} without`,
        cx,
        body.y + body.h * 0.76,
      );
      ctx.fillText("a wedgie", cx, body.y + body.h * 0.87);
    }
  }
  ctx.restore();
}

/** The site's sticker button: cream, ink border, hard violet shadow. */
function drawSticker(scene: Scene, layout: Layout, t: number) {
  const { ctx } = scene;
  const { cx, y, size } = layout.footer;
  const text = "WEDGIETRACKER.COM";
  ctx.save();
  ctx.font = font(900, size);
  const w = ctx.measureText(text).width + size * 1.6;
  const h = size * 2;
  const box = { x: cx - w / 2, y, w, h };
  if (enter(ctx, t, 2.4, 0.5, box, { pop: true })) {
    const unit = size / 24;
    const shadow = 6 * unit;
    ctx.fillStyle = VIOLET;
    ctx.beginPath();
    ctx.roundRect(box.x + shadow, box.y + shadow, w, h, 16 * unit);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, w, h, 16 * unit);
    ctx.fillStyle = CREAM;
    ctx.fill();
    ctx.lineWidth = 3 * unit;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, box.y + h / 2 + size * 0.04);
  }
  ctx.restore();
}

export function drawStatsFrame(scene: Scene, t: number) {
  const { ctx, width, height } = scene;
  const layout = LAYOUTS[scene.format];
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.drawImage(scene.background, 0, 0, width, height);
  drawWave(scene, t);
  drawConfetti(scene, t);
  drawLogo(scene, layout, t);
  drawHero(scene, layout, t);
  drawPace(scene, layout, t);
  drawCalendar(scene, layout, t);
  drawSticker(scene, layout, t);
  ctx.restore();
}

/**
 * Loads the logo from this site, so it never depends on another origin
 * sending CORS headers. SVGs without a width and height do not draw in every
 * browser, so the size is written in before loading.
 */
export async function loadLogo(
  url: string,
  signal?: AbortSignal,
): Promise<{ image: HTMLCanvasElement; aspect: number } | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    let svg = await res.text();
    const viewBox = /viewBox="([\d.\s-]+)"/.exec(svg)?.[1]?.split(/\s+/);
    const vw = Number(viewBox?.[2] ?? 200);
    const vh = Number(viewBox?.[3] ?? 63);
    if (!/<svg[^>]*\swidth=/.test(svg)) {
      svg = svg.replace("<svg", `<svg width="${vw * 4}" height="${vh * 4}"`);
    }
    const blobUrl = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml" }),
    );
    try {
      const image = new Image();
      image.src = blobUrl;
      await image.decode();
      // Rasterise once, so each frame copies pixels instead of redrawing the SVG.
      const raster = document.createElement("canvas");
      raster.width = Math.round(vw * 4);
      raster.height = Math.round(vh * 4);
      raster
        .getContext("2d")
        ?.drawImage(image, 0, 0, raster.width, raster.height);
      return { image: raster, aspect: vw / vh };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}

/** Waits for the weights the video uses, so the first frames are not drawn in a fallback face. */
export async function loadVideoFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(
    [700, 800, 900].map((w) =>
      document.fonts
        .load(`${w} 100px Inter`, "0123456789WEDGIES")
        .catch(() => []),
    ),
  );
}
