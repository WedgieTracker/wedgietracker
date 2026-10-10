import { describe, it, expect, vi } from "vitest";

const seasons = [
  { id: 1, totalGames: 1000, wedgies: Array.from({ length: 40 }) },
  { id: 2, totalGames: 1000, wedgies: Array.from({ length: 60 }) },
  // a shortened season: fewer games, so fewer wedgies
  { id: 4, totalGames: 500, wedgies: Array.from({ length: 35 }) },
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
  it("starts from the average wedgies per season, leaving the current season out", async () => {
    // (40 + 60 + 35) / 3 = 45 per season, spread over 1000 games;
    // 0 + 0.045 * (1000 - 3) = 44.87 → 45, the average itself
    const pace = await calculatePace({
      currentTotalWedgies: 0,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.rmPace).toBe(45);
    expect(pace.medianPace).toBe(45);
  });

  it("adds this season's wedgies on top of the historical projection", async () => {
    // 2 + 0.045 * 997 = 46.87 → 47
    const pace = await calculatePace({
      currentTotalWedgies: 2,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.medianPace).toBe(47);
  });
});
