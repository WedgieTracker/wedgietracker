import { describe, it, expect } from "vitest";
import { formatDate, isGemsDate, GEMS_EMOJI } from "./formatDate";

describe("formatDate", () => {
  it("formats a date in uppercase US long format", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const result = formatDate(date);
    expect(result).toBe("JANUARY 15, 2024");
  });

  it("handles single-digit days", () => {
    const date = new Date("2024-03-01T12:00:00Z");
    const result = formatDate(date);
    expect(result).toBe("MARCH 1, 2024");
  });

  it("handles end-of-year dates", () => {
    const date = new Date("2024-12-31T12:00:00Z");
    const result = formatDate(date);
    expect(result).toBe("DECEMBER 31, 2024");
  });

  it("returns uppercase output", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const result = formatDate(date);
    expect(result).toBe(result.toUpperCase());
  });
});

describe("isGemsDate", () => {
  it("detects the GEMS epoch placeholder regardless of timezone", () => {
    expect(isGemsDate(new Date("1969-12-31T22:00:00.000Z"))).toBe(true);
    expect(isGemsDate(new Date(0))).toBe(true);
  });

  it("returns false for real wedgie dates", () => {
    expect(isGemsDate(new Date("2024-01-15T20:00:00.000Z"))).toBe(false);
    expect(isGemsDate(new Date("2000-01-01T00:00:00.000Z"))).toBe(false);
  });
});

describe("formatDate with GEMS dates", () => {
  it("renders the gem emoji for the epoch placeholder", () => {
    expect(formatDate(new Date("1969-12-31T22:00:00.000Z"))).toBe(GEMS_EMOJI);
  });
});
