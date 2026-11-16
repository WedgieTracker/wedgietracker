// Draws a share of a Reel or Short's wave band frames and writes them to
// stdout as raw BGRA, for composeWithWaveBand in waveBand.ts. Frames are a
// pure function of their index, so several of these split a band between
// them round-robin (frames start, start + step, start + 2 * step, ...) and
// the parent takes them back in order. Plain JS so it runs under bare node.
import { createCanvas, loadImage } from "canvas";

const GLOW_STOPS = [
  [0, "#5f84e6"],
  [0.5, "#7b6bf0"],
  [1, "#a65ff5"],
];
const LAYERS = [
  { colour: "rgba(95, 132, 230, 0.4)", lift: 0, speed: 70 },
  { colour: "rgba(166, 95, 245, 0.3)", lift: 14, speed: -55 },
  { colour: "rgba(123, 107, 240, 0.2)", lift: 24, speed: 40 },
];

const easeOutCubic = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

function wavePath(ctx, width, bottom, baseY, amplitude, wavelength, offset) {
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

const job = JSON.parse(process.argv[2]);
const { w, h, fps, frames, start, step, settled, nightPath, textPath } = job;
const unit = w / 1080;
const amplitude = 22 * unit;
const wavelength = w * 0.55;

const night = await loadImage(nightPath);
const text = await loadImage(textPath);
const canvas = createCanvas(w, h);
const ctx = canvas.getContext("2d");
const glow = ctx.createLinearGradient(0, 0, w, 0);
for (const [stop, colour] of GLOW_STOPS) glow.addColorStop(stop, colour);

for (let i = start; i < frames; i += step) {
  const t = i / fps;
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

  if (!process.stdout.write(canvas.toBuffer("raw"))) {
    await new Promise((r) => process.stdout.once("drain", r));
  }
}
