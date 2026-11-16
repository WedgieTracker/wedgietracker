// @vitest-environment node
import { describe, expect, it } from "vitest";
import { easternToUtc, nameWallClock } from "../../scripts/eastern-time.mjs";

describe("easternToUtc", () => {
  it("is five hours behind in winter and four in summer", () => {
    expect(easternToUtc("2026-11-14", "20:00")).toBe(
      "2026-11-15T01:00:00.000Z",
    );
    expect(easternToUtc("2026-04-10", "19:30:00")).toBe(
      "2026-04-10T23:30:00.000Z",
    );
  });

  it("crosses the March change on the right side", () => {
    // DST starts at 2am on Sunday 8 March 2026
    expect(easternToUtc("2026-03-07", "19:00")).toBe(
      "2026-03-08T00:00:00.000Z",
    );
    expect(easternToUtc("2026-03-08", "01:30")).toBe(
      "2026-03-08T06:30:00.000Z",
    );
    expect(easternToUtc("2026-03-08", "15:30")).toBe(
      "2026-03-08T19:30:00.000Z",
    );
    expect(easternToUtc("2026-03-08", "19:00")).toBe(
      "2026-03-08T23:00:00.000Z",
    );
  });

  it("crosses the November change on the right side", () => {
    // DST ends at 2am on Sunday 1 November 2026
    expect(easternToUtc("2026-10-31", "19:30")).toBe(
      "2026-10-31T23:30:00.000Z",
    );
    expect(easternToUtc("2026-11-01", "15:30")).toBe(
      "2026-11-01T20:30:00.000Z",
    );
    expect(easternToUtc("2026-11-01", "19:30")).toBe(
      "2026-11-02T00:30:00.000Z",
    );
    // and a 2022 game, the first season with times in names
    expect(easternToUtc("2022-11-06", "18:00")).toBe(
      "2022-11-06T23:00:00.000Z",
    );
  });

  it("is null for a day or time that isn't one", () => {
    expect(easternToUtc("2026-02-30", "19:00")).toBeNull();
    expect(easternToUtc("2026-11-14", "24:00")).toBeNull();
    expect(easternToUtc("tonight", "19:00")).toBeNull();
  });
});

describe("nameWallClock", () => {
  it("reads the Eastern time a name carries, for the backfill only", () => {
    expect(nameWallClock("MIA @ DET - 2025-03-19T19:30:00Z")).toEqual({
      home: "MIA",
      away: "DET",
      day: "2025-03-19",
      time: "19:30:00",
    });
    expect(nameWallClock("EST @ WST - 2024-02-18T20:00:00")).toMatchObject({
      time: "20:00:00",
    });
  });

  it("treats midnight and names without a time as unknown", () => {
    expect(nameWallClock("NOP @ ORL - 2014-10-28T00:00:00.000Z")).toBeNull();
    expect(nameWallClock("NOP @ ORL - 2023-10-28T00:00:00Z")).toBeNull();
    expect(nameWallClock("NOP @ ORL - 2023-10-28")).toBeNull();
  });
});
