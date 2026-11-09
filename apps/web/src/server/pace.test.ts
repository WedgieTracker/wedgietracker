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
  it("starts from the past seasons' rate per game played, leaving the current season out", async () => {
    // plain average: (40/1000 + 60/1000 + 35/500) / 3 = 0.0567 a game;
    // 0 + 0.0567 * (1000 - 3) = 56.5 → 56
    // the pace: recent seasons count more, (0.07 + 0.8 * 0.06 + 0.64 * 0.04) / 2.44
    // = 0.0589 a game, blended with 3 real games: 0 + 0.0586 * 997 = 58.4 → 58
    const pace = await calculatePace({
      currentTotalWedgies: 0,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.rmPace).toBe(56);
    expect(pace.medianPace).toBe(58);
  });

  it("adds this season's wedgies on top, and lets them nudge the rate", async () => {
    // (2 + 600 * 0.0589) / 603 = 0.0619 a game; 2 + 0.0619 * 997 = 63.7 → 64
    const pace = await calculatePace({
      currentTotalWedgies: 2,
      currentTotalGames: 3,
      totalEstimatedGames: 1000,
    });
    expect(pace.medianPace).toBe(64);
  });
});
