import { describe, it, expect } from "vitest";
import { computePace } from "./paceCalculator";

describe("computePace", () => {
  it("returns zeros when currentTotalGames is 0", () => {
    const result = computePace({
      currentTotalWedgies: 10,
      currentTotalGames: 0,
      seasonRates: [0.05],
    });
    expect(result.simplePace).toBe(0);
    expect(result.rmPace).toBe(0);
    expect(result.medianPace).toBe(0);
    expect(result.gamesRemaining).toBe(1315);
  });

  it("returns zeros when currentTotalGames is negative", () => {
    const result = computePace({
      currentTotalWedgies: 5,
      currentTotalGames: -1,
      seasonRates: [],
    });
    expect(result.simplePace).toBe(0);
    expect(result.gamesRemaining).toBe(1315);
  });

  it("calculates simple pace correctly", () => {
    // 10 wedgies in 100 games = 0.1 per game, projected over 1000 games = 100
    const result = computePace({
      currentTotalWedgies: 10,
      currentTotalGames: 100,
      totalEstimatedGames: 1000,
      seasonRates: [0.1],
    });
    expect(result.simplePace).toBe(100);
  });

  it("uses default totalEstimatedGames of 1315", () => {
    const result = computePace({
      currentTotalWedgies: 10,
      currentTotalGames: 100,
      seasonRates: [0.1],
    });
    // 10/100 * 1315 = 131.5 → 132
    expect(result.simplePace).toBe(132);
    expect(result.gamesRemaining).toBe(1215);
  });

  it("calculates rmPace using historical season rates", () => {
    // currentTotalWedgies: 10, gamesRemaining: 900
    // averageSeasonRate: (0.05 + 0.15) / 2 = 0.1
    // rmPace = 10 + 0.1 * 900 = 100
    const result = computePace({
      currentTotalWedgies: 10,
      currentTotalGames: 100,
      totalEstimatedGames: 1000,
      seasonRates: [0.05, 0.15],
    });
    expect(result.rmPace).toBe(100);
  });

  it("falls back to simplePace when no season rates provided", () => {
    const result = computePace({
      currentTotalWedgies: 10,
      currentTotalGames: 100,
      totalEstimatedGames: 1000,
      seasonRates: [],
    });
    expect(result.rmPace).toBe(result.simplePace);
    expect(result.medianPace).toBe(result.simplePace);
  });

  it("sets medianPace equal to rmPace", () => {
    const result = computePace({
      currentTotalWedgies: 20,
      currentTotalGames: 200,
      totalEstimatedGames: 1000,
      seasonRates: [0.08, 0.12],
    });
    expect(result.medianPace).toBe(result.rmPace);
  });

  it("handles a single season rate", () => {
    // rate: 0.05, gamesRemaining: 900
    // rmPace = 10 + 0.05 * 900 = 55
    const result = computePace({
      currentTotalWedgies: 10,
      currentTotalGames: 100,
      totalEstimatedGames: 1000,
      seasonRates: [0.05],
    });
    expect(result.rmPace).toBe(55);
  });

  it("handles when all games are played (gamesRemaining = 0)", () => {
    const result = computePace({
      currentTotalWedgies: 50,
      currentTotalGames: 1000,
      totalEstimatedGames: 1000,
      seasonRates: [0.05],
    });
    expect(result.gamesRemaining).toBe(0);
    // rmPace = 50 + 0.05 * 0 = 50
    expect(result.rmPace).toBe(50);
    // simplePace = 1000 * (50/1000) = 50
    expect(result.simplePace).toBe(50);
  });

  it("rounds results to integers", () => {
    const result = computePace({
      currentTotalWedgies: 7,
      currentTotalGames: 100,
      totalEstimatedGames: 1000,
      seasonRates: [0.073],
    });
    expect(Number.isInteger(result.simplePace)).toBe(true);
    expect(Number.isInteger(result.rmPace)).toBe(true);
  });
});
