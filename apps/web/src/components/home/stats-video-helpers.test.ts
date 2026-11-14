import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getWedgieDays,
  pickStatusText,
  pickFileExtension,
  pickSupportedMimeType,
  pickEncodingMethod,
  buildVideoFilename,
  formatBytes,
  fillLevel,
  paceFraction,
  frameCount,
  frameTime,
  phase,
  countUp,
  easeOutCubic,
  easeOutBack,
  seededRandom,
  createConfetti,
  confettiPosition,
  RECORDER_MIME_TYPES,
  VIDEO_FORMATS,
} from "./stats-video-helpers";

describe("getWedgieDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zero / false when no last wedgie is supplied", () => {
    expect(getWedgieDays(null)).toEqual({
      daysWithoutWedgie: 0,
      hasNewWedgie: false,
    });
  });

  it("flags a wedgie within the last day as new", () => {
    expect(getWedgieDays("2026-01-15T06:00:00.000Z").hasNewWedgie).toBe(true);
  });

  it("treats a wedgie >24h ago as not new", () => {
    const result = getWedgieDays("2026-01-13T12:00:00.000Z");
    expect(result.hasNewWedgie).toBe(false);
    // 2 days elapsed exactly → ceil(2) - 1 = 1
    expect(result.daysWithoutWedgie).toBe(1);
  });

  it("counts days without rounding errors for fractional gaps", () => {
    // ~6.5 days ago → ceil(6.5) - 1 = 6
    const sixAndAHalfDaysAgo =
      new Date("2026-01-15T12:00:00.000Z").getTime() -
      6.5 * 24 * 60 * 60 * 1000;
    expect(getWedgieDays(new Date(sixAndAHalfDaysAgo)).daysWithoutWedgie).toBe(
      6,
    );
  });

  it("uses the time it is given instead of the clock", () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    expect(
      getWedgieDays("2026-01-29T00:00:00.000Z", now).daysWithoutWedgie,
    ).toBe(3);
  });

  it("never goes below zero when the wedgie looks to be in the future", () => {
    expect(getWedgieDays("2026-01-16T12:00:00.000Z").daysWithoutWedgie).toBe(0);
  });
});

describe("pickStatusText", () => {
  it("returns NEW ALL-TIME RECORD when above previous", () => {
    expect(pickStatusText(10, 9)).toBe("NEW ALL-TIME RECORD");
  });
  it("returns ALL-TIME RECORD TIED when equal", () => {
    expect(pickStatusText(9, 9)).toBe("ALL-TIME RECORD TIED");
  });
  it("returns WE'RE AT when below previous", () => {
    expect(pickStatusText(5, 9)).toBe("WE'RE AT");
  });
});

describe("pickFileExtension", () => {
  it("returns webm for webm-family MIME types", () => {
    expect(pickFileExtension("video/webm")).toBe("webm");
    expect(pickFileExtension("video/webm;codecs=vp9")).toBe("webm");
  });
  it("returns mp4 for mp4 and unknown types", () => {
    expect(pickFileExtension("video/mp4")).toBe("mp4");
    expect(pickFileExtension('video/mp4;codecs="avc1.640028"')).toBe("mp4");
    expect(pickFileExtension("application/octet-stream")).toBe("mp4");
  });
});

describe("pickSupportedMimeType", () => {
  it("returns the first supported mime in priority order", () => {
    // Pretend only the last (legacy webm) is supported.
    const isSupported = (m: string) => m === "video/webm";
    expect(pickSupportedMimeType(isSupported)).toBe("video/webm");
  });

  it("prefers mp4 over webm when both are supported", () => {
    const isSupported = () => true;
    expect(pickSupportedMimeType(isSupported)).toBe(RECORDER_MIME_TYPES[0]);
    expect(RECORDER_MIME_TYPES[0]).toContain("mp4");
  });

  it("never asks for an audio codec, since the video is silent", () => {
    for (const mime of RECORDER_MIME_TYPES)
      expect(mime).not.toMatch(/mp4a|opus/);
  });

  it("returns undefined when nothing is supported", () => {
    expect(pickSupportedMimeType(() => false)).toBeUndefined();
  });
});

describe("pickEncodingMethod", () => {
  it("prefers WebCodecs whenever it can encode H.264", () => {
    expect(
      pickEncodingMethod({
        canUseWebCodecs: true,
        recorderMimeType: "video/mp4",
      }),
    ).toBe("webcodecs");
  });
  it("falls back to MediaRecorder", () => {
    expect(
      pickEncodingMethod({
        canUseWebCodecs: false,
        recorderMimeType: "video/webm",
      }),
    ).toBe("recorder");
  });
  it("gives up when neither is available", () => {
    expect(
      pickEncodingMethod({
        canUseWebCodecs: false,
        recorderMimeType: undefined,
      }),
    ).toBeNull();
  });
});

describe("buildVideoFilename", () => {
  it("uses ISO date plus the chosen extension", () => {
    const date = new Date("2026-01-15T12:00:00.000Z");
    expect(buildVideoFilename(date, "mp4")).toBe(
      "WedgieTracker-2026-01-15.mp4",
    );
    expect(buildVideoFilename(date, "webm")).toBe(
      "WedgieTracker-2026-01-15.webm",
    );
  });

  it("names the shape when a format is given", () => {
    const date = new Date("2026-01-15T12:00:00.000Z");
    expect(buildVideoFilename(date, "mp4", "portrait")).toBe(
      "WedgieTracker-2026-01-15-vertical.mp4",
    );
    expect(buildVideoFilename(date, "mp4", "landscape")).toBe(
      "WedgieTracker-2026-01-15-landscape.mp4",
    );
  });
});

describe("VIDEO_FORMATS", () => {
  it("makes portrait the 1080x1920 size the vertical apps ask for", () => {
    expect(VIDEO_FORMATS.portrait).toMatchObject({ width: 1080, height: 1920 });
    expect(VIDEO_FORMATS.landscape).toMatchObject({
      width: 1920,
      height: 1080,
    });
  });

  it("uses even sizes, which H.264 needs", () => {
    for (const { width, height } of Object.values(VIDEO_FORMATS)) {
      expect(width % 2).toBe(0);
      expect(height % 2).toBe(0);
    }
  });
});

describe("formatBytes", () => {
  it("picks a readable unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(4_432_398)).toBe("4.2 MB");
  });
});

describe("fillLevel", () => {
  it("is the share of 50 wedgies, capped at full", () => {
    expect(fillLevel(0)).toBe(0);
    expect(fillLevel(13)).toBeCloseTo(0.26);
    expect(fillLevel(50)).toBe(1);
    expect(fillLevel(80)).toBe(1);
  });
});

describe("paceFraction", () => {
  it("measures the pace against the record", () => {
    expect(paceFraction(37, 74)).toBeCloseTo(0.5);
  });
  it("fills the arc when the pace passes the record", () => {
    expect(paceFraction(90, 74)).toBe(1);
  });
  it("copes with a zero record", () => {
    expect(paceFraction(0, 0)).toBe(0);
  });
});

describe("timeline", () => {
  it("has 300 frames for ten seconds at 30 fps", () => {
    expect(frameCount()).toBe(300);
    expect(frameCount(10, 30)).toBe(300);
  });

  it("spaces frames evenly, with no drift", () => {
    expect(frameTime(0)).toBe(0);
    expect(frameTime(30)).toBe(1);
    expect(frameTime(299)).toBeCloseTo(9.9667, 3);
  });

  it("clamps phases to 0..1", () => {
    expect(phase(0, 1, 2)).toBe(0);
    expect(phase(2, 1, 2)).toBe(0.5);
    expect(phase(9, 1, 2)).toBe(1);
    expect(phase(1, 1, 0)).toBe(1);
  });

  it("eases from 0 to 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBeCloseTo(1);
  });

  it("counts up from 0 and lands exactly on the real number", () => {
    expect(countUp(13, 0, 0.35, 1.6)).toBe(0);
    expect(countUp(13, 1, 0.35, 1.6)).toBeGreaterThan(0);
    expect(countUp(13, 1, 0.35, 1.6)).toBeLessThanOrEqual(13);
    expect(countUp(13, 1.95, 0.35, 1.6)).toBe(13);
    expect(countUp(13, 9.9, 0.35, 1.6)).toBe(13);
  });

  it("never counts past the real number on the way up", () => {
    for (let t = 0; t < 3; t += 0.05) {
      expect(countUp(74, t, 0.5, 1.4)).toBeLessThanOrEqual(74);
    }
  });
});

describe("seededRandom", () => {
  it("repeats for the same seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
  });

  it("stays within 0..1", () => {
    const r = seededRandom(1);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("confetti", () => {
  it("is the same every time it is made", () => {
    expect(createConfetti(10, 1080, 1920, 3)).toEqual(
      createConfetti(10, 1080, 1920, 3),
    );
  });

  it("depends only on time, so frames can be drawn in any order", () => {
    const [piece] = createConfetti(1, 1080, 1920, 5);
    expect(confettiPosition(piece!, 4.2, 1080, 1920)).toEqual(
      confettiPosition(piece!, 4.2, 1080, 1920),
    );
  });

  it("wraps round so pieces stay near the frame", () => {
    const [piece] = createConfetti(1, 1080, 1920, 9);
    for (let t = 0; t < 10; t += 0.5) {
      const p = confettiPosition(piece!, t, 1080, 1920);
      const margin = piece!.size * 2;
      expect(p.x).toBeGreaterThanOrEqual(-margin);
      expect(p.x).toBeLessThanOrEqual(1080 + margin);
      expect(p.y).toBeGreaterThanOrEqual(-margin);
      expect(p.y).toBeLessThanOrEqual(1920 + margin);
    }
  });
});
