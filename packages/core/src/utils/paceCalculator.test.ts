import { describe, it, expect } from "vitest";
import { blendedRate, computePace, normalRate } from "./paceCalculator";

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

  it("blends 600 made-up games at the normal rate with this season's real ones", () => {
    // normal rate 0.05, so 600 made-up games bring 30 wedgies;
    // (30 + 11) / (600 + 139) = 0.0555 a game for the 1,176 games left
    // pace = 11 + 0.0555 * 1176 = 76.2 → 76
    const result = computePace({
      currentTotalWedgies: 11,
      currentTotalGames: 139,
      seasonRates: [0.05],
    });
    expect(result.medianPace).toBe(76);
    // the plain average would ignore the hot start: 11 + 0.05 * 1176 = 69.8 → 70
    expect(result.rmPace).toBe(70);
  });

  it("lets this season count more as its games pile up", () => {
    // the same hot rate (0.08 a game) moves the pace more the further in we are
    const early = computePace({
      currentTotalWedgies: 8,
      currentTotalGames: 100,
      totalEstimatedGames: 1300,
      seasonRates: [0.04],
    });
    const late = computePace({
      currentTotalWedgies: 80,
      currentTotalGames: 1000,
      totalEstimatedGames: 1300,
      seasonRates: [0.04],
    });
    const plain = (w: number, g: number) => w + 0.04 * (1300 - g);
    const own = (w: number, g: number) => (w / g) * 1300;
    const share = (r: typeof early, w: number, g: number) =>
      (r.medianPace - plain(w, g)) / (own(w, g) - plain(w, g));
    expect(share(late, 80, 1000)).toBeGreaterThan(share(early, 8, 100));
  });

  it("counts recent seasons more, last season in full and each before at 80%", () => {
    // (0.05 + 0.8 * 0.04) / 1.8 = 0.04556
    expect(normalRate([0.04, 0.05])).toBeCloseTo(0.04556, 5);
    expect(normalRate([0.05])).toBe(0.05);
    expect(normalRate([])).toBe(0);
  });

  it("starts from the normal rate before any games", () => {
    expect(blendedRate(0, 0, [0.05])).toBe(0.05);
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
