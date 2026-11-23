import { describe, it, expect } from "vitest";
import {
  dayMonth,
  drawWedgieOverlay,
  nameLines,
  type OverlayContext,
  type OverlayType,
} from "./wedgieOverlay";

describe("dayMonth", () => {
  it("writes the stored day as dd/mm", () => {
    expect(dayMonth("2026-11-13T00:00:00.000Z")).toBe("13/11");
    expect(dayMonth("2026-01-05")).toBe("05/01");
  });

  it("leaves out missing, broken and GEM dates", () => {
    expect(dayMonth(null)).toBeNull();
    expect(dayMonth("")).toBeNull();
    expect(dayMonth("not a date")).toBeNull();
    expect(dayMonth("1969-12-31T00:00:00.000Z")).toBeNull();
  });
});

describe("nameLines", () => {
  it("splits the name over two lines in capitals", () => {
    expect(nameLines("Branden Carlson")).toEqual(["BRANDEN", "CARLSON"]);
    expect(nameLines("Karl-Anthony Towns Jr.")).toEqual([
      "KARL-ANTHONY TOWNS",
      "JR.",
    ]);
    expect(nameLines("Nene")).toEqual(["NENE"]);
  });
});

const noop = () => undefined;

/** A context that records what is drawn, with every glyph 0.6em wide. */
function recorder() {
  const texts: { text: string; y: number; size: number; font: string }[] = [];
  const rects: { y: number; h: number }[] = [];
  const ctx: OverlayContext = {
    font: "10px InterBlack",
    fillStyle: "#000",
    textAlign: "left",
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    globalAlpha: 1,
    save: noop,
    restore: noop,
    beginPath: noop,
    fill: noop,
    roundRect(_x, y, _w, h) {
      rects.push({ y, h });
    },
    fillText(text, _x, y) {
      texts.push({ text, y, size: parseFloat(this.font), font: this.font });
    },
    measureText(text) {
      return { width: [...text].length * parseFloat(this.font) * 0.6 };
    },
  };
  return { ctx, texts, rects };
}

describe("drawWedgieOverlay", () => {
  it.each<OverlayType>(["reel", "short", "thumbnail"])(
    "keeps the season pill clear of the number on the %s",
    (type) => {
      const { ctx, texts, rects } = recorder();
      drawWedgieOverlay(
        ctx,
        {
          number: 13,
          season: "2026/27",
          player: "Branden Carlson",
          date: "2026-11-13",
        },
        type,
      );
      // The cream number sits on its baseline; its lowest shadow is 0.08em under it.
      const num = texts.filter((t) => t.font.includes("Shrikhand"));
      const numBottom = Math.max(...num.map((t) => t.y + t.size * 0.08));
      const pill = rects[0]!;
      expect(pill.y).toBeGreaterThan(numBottom);
      expect(texts.some((t) => t.text === "2026/27")).toBe(true);
      expect(texts.some((t) => t.text === "13/11")).toBe(true);
    },
  );

  it("draws the name only on the cover", () => {
    for (const type of ["reel", "short", "thumbnail"] as const) {
      const { ctx, texts } = recorder();
      drawWedgieOverlay(
        ctx,
        { number: 13, season: "2026/27", player: "Branden Carlson" },
        type,
      );
      const drawn = texts.map((t) => t.text).join("");
      expect(drawn.includes("BRANDEN")).toBe(type === "thumbnail");
    }
  });

  it("drops the date and keeps the pill when there is no date", () => {
    const { ctx, texts } = recorder();
    drawWedgieOverlay(ctx, { number: 13, season: "2026/27" }, "reel");
    expect(texts.map((t) => t.text)).not.toContain("13/11");
    expect(texts.map((t) => t.text)).toContain("2026/27");
  });
});
