import { describe, it, expect, vi } from "vitest";

const seasons = [
  { id: 1, totalGames: 1000, wedgies: Array.from({ length: 40 }) },
  { id: 2, totalGames: 1000, wedgies: Array.from({ length: 60 }) },
  // current season, a few games in with no wedgies yet
  { id: 3, totalGames: 3, wedgies: [] },
];

vi.mock("./db", () => ({
  db: {
    query: {
      season: { findMany: vi.fn(async () => seasons) },
      global: { findFirst: vi.fn(async () => ({ currentSeasonId: 3 })) },
    },
  },
}));

const { calculatePace } = await import("./pace");

describe("calculatePace", () => {
  it("averages only completed seasons, leaving the current season out", async () => {
    // average rate (0.04 + 0.06) / 2 = 0.05; 0 + 0.05 * (1000 - 3) = 49.85 → 50
    const pace = await calculatePace({
      currentTotalWedgies: 0,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.rmPace).toBe(50);
    expect(pace.medianPace).toBe(50);
  });

  it("adds this season's wedgies on top of the historical projection", async () => {
    // 1 + 0.05 * 997 = 50.85 → 51
    const pace = await calculatePace({
      currentTotalWedgies: 1,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.medianPace).toBe(51);
  });
});
