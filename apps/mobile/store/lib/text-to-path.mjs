/**
 * Converts a string set in a TrueType font into an SVG path.
 *
 * Why this exists rather than `<text font-family="Inter">`: the SVG renderer
 * behind sharp resolves font families through the host's font book, and Inter
 * is not installed on this machine - it only ships inside
 * @expo-google-fonts/inter as raw .ttf files. Pointing fontconfig at that
 * directory does not help either; a control render of "Inter" and of a
 * deliberately missing family came back byte-identical, so the family name is
 * being ignored and everything silently falls back to Helvetica.
 *
 * Reading the outlines ourselves keeps the marketing type identical to the
 * type inside the app, on any machine, with nothing to install first.
 *
 * Only what the headlines need is implemented: the format 4 cmap, simple and
 * composite glyf outlines, and hmtx advances. No kerning (GPOS is ignored),
 * which is acceptable because the headlines are short, uppercase and tracked.
 */

import fs from "node:fs/promises";

const ON_CURVE = 0x01;
const X_SHORT = 0x02;
const Y_SHORT = 0x04;
const REPEAT = 0x08;
const X_SAME_OR_POSITIVE = 0x10;
const Y_SAME_OR_POSITIVE = 0x20;

const ARG_1_AND_2_ARE_WORDS = 0x0001;
const ARGS_ARE_XY_VALUES = 0x0002;
const WE_HAVE_A_SCALE = 0x0008;
const MORE_COMPONENTS = 0x0020;
const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
const WE_HAVE_A_TWO_BY_TWO = 0x0080;

/** Depth limit on composite glyphs, so a malformed font cannot loop forever. */
const MAX_COMPONENT_DEPTH = 5;

export async function loadFont(file) {
  const buffer = await fs.readFile(file);
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );

  const tables = {};
  const tableCount = view.getUint16(4);
  for (let i = 0; i < tableCount; i += 1) {
    const record = 12 + 16 * i;
    const tag = String.fromCharCode(
      buffer[record],
      buffer[record + 1],
      buffer[record + 2],
      buffer[record + 3],
    );
    tables[tag] = view.getUint32(record + 8);
  }

  const head = tables.head;
  const unitsPerEm = view.getUint16(head + 18);
  const longLoca = view.getInt16(head + 50) === 1;
  const numGlyphs = view.getUint16(tables.maxp + 4);
  const numberOfHMetrics = view.getUint16(tables.hhea + 34);

  // sCapHeight only exists from OS/2 version 2; every Inter face is version 4.
  const os2 = tables["OS/2"];
  const capHeight =
    os2 !== undefined && view.getUint16(os2) >= 2
      ? view.getInt16(os2 + 88)
      : Math.round(unitsPerEm * 0.7);

  const cmap = readCmap(view, tables.cmap);

  const glyphOffset = (index) =>
    longLoca
      ? view.getUint32(tables.loca + index * 4)
      : view.getUint16(tables.loca + index * 2) * 2;

  const advanceOf = (index) => {
    const capped = Math.min(index, numberOfHMetrics - 1);
    return view.getUint16(tables.hmtx + capped * 4);
  };

  /** Contours in font units, y up. */
  const contoursOf = (index, depth = 0) => {
    if (index >= numGlyphs) return [];
    const start = glyphOffset(index);
    const end = glyphOffset(index + 1);
    // An empty loca entry means a blank glyph, e.g. the space.
    if (end <= start) return [];

    const at = tables.glyf + start;
    const numberOfContours = view.getInt16(at);
    return numberOfContours >= 0
      ? readSimpleGlyph(view, at, numberOfContours)
      : readCompositeGlyph(view, at, contoursOf, depth);
  };

  return { unitsPerEm, capHeight, cmap, advanceOf, contoursOf };
}

function readCmap(view, cmapOffset) {
  const subtableCount = view.getUint16(cmapOffset + 2);
  let best = 0;
  for (let i = 0; i < subtableCount; i += 1) {
    const record = cmapOffset + 4 + i * 8;
    const platform = view.getUint16(record);
    const encoding = view.getUint16(record + 2);
    const offset = cmapOffset + view.getUint32(record + 4);
    // Windows BMP is the one every Google font ships and the only format 4
    // table we need for Latin headlines.
    if (platform === 3 && encoding === 1) best = offset;
  }
  if (!best) throw new Error("No (3,1) cmap subtable in font");
  if (view.getUint16(best) !== 4)
    throw new Error("cmap subtable is not format 4");

  const segCount = view.getUint16(best + 6) / 2;
  const endsAt = best + 14;
  const startsAt = endsAt + segCount * 2 + 2;
  const deltasAt = startsAt + segCount * 2;
  const rangesAt = deltasAt + segCount * 2;

  return (codePoint) => {
    for (let s = 0; s < segCount; s += 1) {
      if (view.getUint16(endsAt + s * 2) < codePoint) continue;
      const first = view.getUint16(startsAt + s * 2);
      if (first > codePoint) return 0;
      const rangeOffset = view.getUint16(rangesAt + s * 2);
      if (rangeOffset === 0) {
        return (codePoint + view.getInt16(deltasAt + s * 2)) & 0xffff;
      }
      const at = rangesAt + s * 2 + rangeOffset + (codePoint - first) * 2;
      const glyph = view.getUint16(at);
      return glyph === 0
        ? 0
        : (glyph + view.getInt16(deltasAt + s * 2)) & 0xffff;
    }
    return 0;
  };
}

function readSimpleGlyph(view, at, numberOfContours) {
  let cursor = at + 10;
  const endPoints = [];
  for (let i = 0; i < numberOfContours; i += 1, cursor += 2) {
    endPoints.push(view.getUint16(cursor));
  }
  const pointCount = endPoints[endPoints.length - 1] + 1;

  // Hinting instructions sit between the end points and the flags.
  cursor += 2 + view.getUint16(cursor);

  const flags = [];
  while (flags.length < pointCount) {
    const flag = view.getUint8(cursor++);
    flags.push(flag);
    if (flag & REPEAT) {
      const repeats = view.getUint8(cursor++);
      for (let i = 0; i < repeats; i += 1) flags.push(flag);
    }
  }

  const readDeltas = (shortBit, sameBit) => {
    const values = [];
    let value = 0;
    for (const flag of flags) {
      if (flag & shortBit) {
        const delta = view.getUint8(cursor++);
        value += flag & sameBit ? delta : -delta;
      } else if (!(flag & sameBit)) {
        value += view.getInt16(cursor);
        cursor += 2;
      }
      values.push(value);
    }
    return values;
  };

  const xs = readDeltas(X_SHORT, X_SAME_OR_POSITIVE);
  const ys = readDeltas(Y_SHORT, Y_SAME_OR_POSITIVE);

  const contours = [];
  let from = 0;
  for (const end of endPoints) {
    const points = [];
    for (let i = from; i <= end; i += 1) {
      points.push({ x: xs[i], y: ys[i], on: (flags[i] & ON_CURVE) !== 0 });
    }
    if (points.length) contours.push(points);
    from = end + 1;
  }
  return contours;
}

function readCompositeGlyph(view, at, contoursOf, depth) {
  if (depth >= MAX_COMPONENT_DEPTH) return [];
  let cursor = at + 10;
  const contours = [];

  for (;;) {
    const flags = view.getUint16(cursor);
    const glyphIndex = view.getUint16(cursor + 2);
    cursor += 4;

    let dx;
    let dy;
    if (flags & ARG_1_AND_2_ARE_WORDS) {
      dx = view.getInt16(cursor);
      dy = view.getInt16(cursor + 2);
      cursor += 4;
    } else {
      dx = view.getInt8(cursor);
      dy = view.getInt8(cursor + 1);
      cursor += 2;
    }
    // Point-matched components are vanishingly rare and never in Latin caps.
    if (!(flags & ARGS_ARE_XY_VALUES)) {
      dx = 0;
      dy = 0;
    }

    let a = 1;
    let b = 0;
    let c = 0;
    let d = 1;
    const f2dot14 = (offset) => view.getInt16(offset) / 16384;
    if (flags & WE_HAVE_A_SCALE) {
      a = d = f2dot14(cursor);
      cursor += 2;
    } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
      a = f2dot14(cursor);
      d = f2dot14(cursor + 2);
      cursor += 4;
    } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
      a = f2dot14(cursor);
      b = f2dot14(cursor + 2);
      c = f2dot14(cursor + 4);
      d = f2dot14(cursor + 6);
      cursor += 8;
    }

    for (const contour of contoursOf(glyphIndex, depth + 1)) {
      contours.push(
        contour.map((p) => ({
          x: a * p.x + c * p.y + dx,
          y: b * p.x + d * p.y + dy,
          on: p.on,
        })),
      );
    }

    if (!(flags & MORE_COMPONENTS)) break;
  }
  return contours;
}

const round = (value) => Number(value.toFixed(2));

/**
 * Lays out `text` and returns its outline as one `d` attribute.
 *
 * The path is emitted already in SVG space - y down, origin at the canvas
 * corner - so the caller can drop it straight into a `<path>` with no wrapping
 * transform. `letterSpacing` is in the same units as `fontSize`.
 */
export function textToPath(
  font,
  text,
  { fontSize, letterSpacing = 0, x, baseline },
) {
  const scale = fontSize / font.unitsPerEm;
  const parts = [];
  let pen = 0;

  for (const character of text) {
    const glyphIndex = font.cmap(character.codePointAt(0));
    const px = (value) => round(x + pen + value * scale);
    const py = (value) => round(baseline - value * scale);

    for (const contour of font.contoursOf(glyphIndex)) {
      parts.push(contourToPath(contour, px, py));
    }
    pen += font.advanceOf(glyphIndex) * scale + letterSpacing;
  }

  return { d: parts.join(" "), width: pen - letterSpacing };
}

/** Advance width of `text` without building the outline. */
export function measureText(font, text, { fontSize, letterSpacing = 0 }) {
  const scale = fontSize / font.unitsPerEm;
  let pen = 0;
  for (const character of text) {
    pen +=
      font.advanceOf(font.cmap(character.codePointAt(0))) * scale +
      letterSpacing;
  }
  return pen - letterSpacing;
}

/**
 * A TrueType contour is a ring of points that alternates between on-curve
 * anchors and off-curve quadratic controls, and two consecutive off-curve
 * points imply an on-curve point half way between them.
 */
function contourToPath(contour, px, py) {
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });

  // Rotate so the ring starts on an anchor; if it has none, synthesise one.
  const startIndex = contour.findIndex((p) => p.on);
  let points;
  let start;
  if (startIndex === -1) {
    start = mid(contour[0], contour[contour.length - 1]);
    points = contour;
  } else {
    start = contour[startIndex];
    points = [
      ...contour.slice(startIndex + 1),
      ...contour.slice(0, startIndex + 1),
    ];
  }

  const segments = [`M ${px(start.x)} ${py(start.y)}`];
  let control = null;

  for (const point of points) {
    if (point.on) {
      segments.push(
        control
          ? `Q ${px(control.x)} ${py(control.y)} ${px(point.x)} ${py(point.y)}`
          : `L ${px(point.x)} ${py(point.y)}`,
      );
      control = null;
    } else if (control) {
      const implied = mid(control, point);
      segments.push(
        `Q ${px(control.x)} ${py(control.y)} ${px(implied.x)} ${py(implied.y)}`,
      );
      control = point;
    } else {
      control = point;
    }
  }

  if (control) {
    segments.push(
      `Q ${px(control.x)} ${py(control.y)} ${px(start.x)} ${py(start.y)}`,
    );
  }
  segments.push("Z");
  return segments.join(" ");
}
