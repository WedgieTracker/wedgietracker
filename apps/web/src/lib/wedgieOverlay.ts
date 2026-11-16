import { isGemsDate } from "@wedgietracker/core/utils/formatDate";

/**
 * The text drawn over the Reel, Short and cover templates: a small
 * "WEDGIE" label, the number in Inter Black Italic with the Home counter's
 * two shadows and a small faded hash before it, as the site's rows have, the player's name on the cover, then the date and
 * the season in a pill. Shared by the server (node-canvas) and the admin
 * preview (browser canvas), so the two can't drift apart.
 *
 * Positions come from the artwork's build script and are in the full-size
 * template's pixels (1080 wide for the Reel, 2160 for the Short and cover).
 * `scale` draws them smaller, for the half-size admin preview. Shadow offsets
 * ignore canvas transforms, so everything is scaled by hand instead.
 *
 * The fonts must be registered under these family names before drawing:
 * InterExtraBold (800), InterBlack (900) and InterBlackItalic (900 italic).
 */

export type OverlayType = "short" | "thumbnail" | "reel";

export interface OverlayData {
  number: number;
  season: string;
  player?: string;
  /** The wedgie's date, drawn as dd/mm. Left out when missing or a GEM. */
  date?: string | Date | null;
}

/** The parts of a 2D context the overlay uses, shared by the browser and node-canvas. */
export interface OverlayContext {
  font: string;
  fillStyle: unknown;
  textAlign: unknown;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  globalAlpha: number;
  save(): void;
  restore(): void;
  beginPath(): void;
  fill(): void;
  roundRect(x: number, y: number, w: number, h: number, r: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
}

const CREAM = "#F0E1B6";
const DROP = "#2a1a5c";
const DROP_SOFT = "rgba(10, 5, 30, 0.45)";
const SUB = "rgba(240, 225, 182, 0.78)";
const PILL = "rgba(20, 10, 46, 0.42)";

const WIDTH: Record<OverlayType, number> = {
  reel: 1080,
  short: 2160,
  thumbnail: 2160,
};

interface Layout {
  k: number;
  label: number;
  num: number;
  numSize: number;
  row: number;
  name?: [number, number];
  nameSize?: number;
}

function layout(type: OverlayType): Layout {
  if (type === "thumbnail") {
    const zone = 1440;
    const k = 2;
    return {
      k,
      label: zone + 150 * k,
      num: zone + 500 * k,
      numSize: 400 * k,
      name: [zone + 690 * k, zone + 805 * k],
      nameSize: 112 * k,
      row: zone + 975 * k,
    };
  }
  const zone = type === "reel" ? 1390 : 2770;
  const k = type === "reel" ? 1 : 2;
  return {
    k,
    label: zone + 112 * k,
    num: zone + 335 * k,
    numSize: 240 * k,
    row: zone + 418 * k,
  };
}

/** dd/mm from the date's calendar day, the same day the admin form shows. */
export function dayMonth(date: string | Date | null | undefined) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime()) || isGemsDate(d)) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}

/** The name in capitals over two lines, split near the middle by words. */
export function nameLines(player: string): string[] {
  const words = player.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words;
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/** Width of the text with extra space after every character, like SVG letter-spacing. */
function trackedWidth(ctx: OverlayContext, text: string, spacing: number) {
  return ctx.measureText(text).width + spacing * [...text].length;
}

/**
 * Centred text with tracking. Each character goes where the untracked prefix
 * before it ends plus the spacing so far, so kerning pairs survive.
 */
function trackedText(
  ctx: OverlayContext,
  text: string,
  cx: number,
  y: number,
  spacing: number,
  dx = 0,
) {
  const chars = [...text];
  const x = cx - trackedWidth(ctx, text, spacing) / 2 + dx;
  let prefix = "";
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    const start = ctx.measureText(prefix).width + spacing * i;
    ctx.fillText(ch, x + start, y);
    prefix += ch;
  });
}

/**
 * Cream text over two copies: #2a1a5c 0.04em down, and a soft dark one
 * 0.08em down blurred 0.14em (the Home counter's text-shadow-badge).
 */
function shadowedText(
  ctx: OverlayContext,
  text: string,
  cx: number,
  y: number,
  size: number,
  spacing: number,
) {
  // The blurred copy alone: the glyphs are drawn far off to the left and
  // only their shadow lands in place, so it never paints over its neighbours.
  const away = 100000;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.shadowColor = DROP_SOFT;
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetX = away;
  ctx.shadowOffsetY = size * 0.08;
  trackedText(ctx, text, cx, y, spacing, -away);
  ctx.restore();

  ctx.fillStyle = DROP;
  trackedText(ctx, text, cx, y + size * 0.04, spacing);
  ctx.fillStyle = CREAM;
  trackedText(ctx, text, cx, y, spacing);
}

/** Largest size up to `size` at which the widest line fits `maxWidth`. */
function fitSize(
  ctx: OverlayContext,
  lines: string[],
  family: string,
  size: number,
  maxWidth: number,
  tracking: number,
) {
  let s = size;
  const widest = () =>
    Math.max(
      ...lines.map((l) => {
        ctx.font = `${s}px ${family}`;
        return trackedWidth(ctx, l, tracking * s);
      }),
    );
  while (s > 10 && widest() > maxWidth) s -= Math.max(1, size / 40);
  return s;
}

export function drawWedgieOverlay(
  ctx: OverlayContext,
  data: OverlayData,
  type: OverlayType,
  scale = 1,
) {
  const L = layout(type);
  const W = WIDTH[type];
  const p = (v: number) => v * scale;
  const cx = p(W / 2);
  const k = L.k;

  ctx.save();

  // "WEDGIE" label
  ctx.font = `${p(44 * k)}px InterExtraBold`;
  ctx.fillStyle = SUB;
  trackedText(ctx, "WEDGIE", cx, p(L.label), p(6 * k));

  // The number, shrunk only if it would run off the side, with the site's
  // small hash before it (0.42em, faded, on the number's baseline). The pair
  // is centred together.
  const num = String(data.number);
  const numSize = p(
    fitSize(ctx, [`#${num}`], "InterBlackItalic", L.numSize, W * 0.86, -0.03),
  );
  const hashSize = numSize * 0.42;
  ctx.font = `${hashSize}px InterBlackItalic`;
  const hashW = ctx.measureText("#").width;
  const hashGap = numSize * 0.06;
  ctx.font = `${numSize}px InterBlackItalic`;
  const numW = trackedWidth(ctx, num, -0.03 * numSize);
  const numLeft = cx - (hashW + hashGap + numW) / 2;
  shadowedText(
    ctx,
    num,
    numLeft + hashW + hashGap + numW / 2,
    p(L.num),
    numSize,
    -0.03 * numSize,
  );
  ctx.save();
  ctx.font = `${hashSize}px InterBlackItalic`;
  ctx.textAlign = "left";
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = CREAM;
  ctx.fillText("#", numLeft, p(L.num));
  ctx.restore();

  // The player's name, cover only, two lines with no box
  const lines = data.player ? nameLines(data.player) : [];
  if (L.name && L.nameSize && lines.length) {
    const nameSize = p(
      fitSize(ctx, lines, "InterBlack", L.nameSize, W * 0.86, -0.01),
    );
    ctx.font = `${nameSize}px InterBlack`;
    const [y1, y2] = L.name;
    const ys = lines.length === 1 ? [(y1 + y2) / 2] : [y1, y2];
    lines.forEach((line, i) =>
      shadowedText(ctx, line, cx, p(ys[i]!), nameSize, -0.01 * nameSize),
    );
  }

  // Date and season pill, centred together
  const ds = 44 * k;
  const pillH = 64 * k;
  const dateW = 124 * k;
  const gap = 22 * k;
  const seasonSize = ds * 0.92;
  ctx.font = `${p(seasonSize)}px InterExtraBold`;
  const pillW = Math.max(
    224 * k,
    ctx.measureText(data.season).width / scale + 48 * k,
  );
  const date = dayMonth(data.date);
  const rowW = date ? dateW + gap + pillW : pillW;
  const left = W / 2 - rowW / 2;
  const pillX = date ? left + dateW + gap : left;
  const pillY = L.row - pillH * 0.74;

  ctx.textAlign = "center";
  if (date) {
    ctx.font = `${p(ds)}px InterExtraBold`;
    ctx.fillStyle = SUB;
    ctx.fillText(date, p(left + dateW / 2), p(L.row));
  }
  ctx.fillStyle = PILL;
  ctx.beginPath();
  ctx.roundRect(p(pillX), p(pillY), p(pillW), p(pillH), p(pillH / 2));
  ctx.fill();
  ctx.font = `${p(seasonSize)}px InterExtraBold`;
  ctx.fillStyle = CREAM;
  ctx.fillText(
    data.season,
    p(pillX + pillW / 2),
    p(pillY + pillH / 2 + ds * 0.35),
  );

  ctx.restore();
}
