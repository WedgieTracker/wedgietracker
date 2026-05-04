import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getWedgieDays,
  pickStatusText,
  pickFileExtension,
  pickSupportedMimeType,
  buildVideoFilename,
  RECORDER_MIME_TYPES,
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
    expect(pickFileExtension('video/mp4;codecs="avc1.424028"')).toBe("mp4");
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
  });

  it("returns undefined when nothing is supported", () => {
    expect(pickSupportedMimeType(() => false)).toBeUndefined();
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
});
