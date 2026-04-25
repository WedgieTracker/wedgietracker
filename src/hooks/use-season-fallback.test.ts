import { describe, it, expect } from "vitest";
import { pickPreviousSeason } from "./use-season-fallback";

const s = (name: string, totalWedgies: number) => ({ name, totalWedgies });

describe("pickPreviousSeason", () => {
  it("returns null when seasons are undefined", () => {
    expect(pickPreviousSeason(undefined, "2025/26")).toBeNull();
  });

  it("returns null when current season name is undefined", () => {
    expect(pickPreviousSeason([s("2024/25", 60)], undefined)).toBeNull();
  });

  it("returns null when current season is not in the list", () => {
    // findIndex returns -1, slot at -2 is undefined → null via fallback
    expect(
      pickPreviousSeason([s("2024/25", 60), s("2023/24", 80)], "1999/00"),
    ).toBeNull();
  });

  it("returns the entry at the position before the current one in array order", () => {
    // The function trusts the caller's array order — it just steps back one
    // index. Whether that's chronologically "previous" depends on how the
    // consumer sorts the list.
    const seasons = [s("2025/26", 0), s("2024/25", 60), s("2023/24", 80)];
    expect(pickPreviousSeason(seasons, "2024/25")).toEqual(s("2025/26", 0));
  });

  it("when current season is first in the list, falls back to first season with wedgies", () => {
    const seasons = [s("2025/26", 0), s("2024/25", 0), s("2023/24", 80)];
    expect(pickPreviousSeason(seasons, "2025/26")).toEqual(s("2023/24", 80));
  });

  it("when current season is first and no prior season has wedgies, returns null", () => {
    const seasons = [s("2025/26", 0), s("2024/25", 0)];
    expect(pickPreviousSeason(seasons, "2025/26")).toBeNull();
  });

  it("when current season is first and another season has wedgies, picks the earliest one with wedgies", () => {
    // .find() returns the first match, so order matters: the earliest-listed
    // season with wedgies wins.
    const seasons = [s("2025/26", 0), s("2024/25", 50), s("2023/24", 80)];
    expect(pickPreviousSeason(seasons, "2025/26")).toEqual(s("2024/25", 50));
  });
});
