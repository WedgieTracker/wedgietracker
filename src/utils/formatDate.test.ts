import { describe, it, expect } from "vitest";
import { formatDate } from "./formatDate";

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
