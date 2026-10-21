import { describe, it, expect, vi } from "vitest";

const seasons = [
  { id: 1, totalGames: 1000, wedgies: Array.from({ length: 40 }) },
  { id: 2, totalGames: 1000, wedgies: Array.from({ length: 60 }) },
  // a shortened season: fewer games, so fewer wedgies but the busiest rate
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
  it("starts from the average rate per game played, leaving the current season out", async () => {
    // (40/1000 + 60/1000 + 35/500) / 3 = 0.0567 a game;
    // 0 + 0.0567 * (1000 - 3) = 56.5 → 56
    const pace = await calculatePace({
      currentTotalWedgies: 0,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.rmPace).toBe(56);
    expect(pace.medianPace).toBe(56);
  });

  it("adds this season's wedgies on top of the historical projection", async () => {
    // 2 + 0.0567 * 997 = 58.5 → 58
    const pace = await calculatePace({
      currentTotalWedgies: 2,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.medianPace).toBe(58);
  });
});
