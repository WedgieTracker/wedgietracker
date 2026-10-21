import { describe, expect, it } from "vitest";
import { gameMoment, gameTimeline } from "./gameMoment";

const at = (
  period: number,
  gameClock: string,
  teamScore?: number,
  opponentScore?: number,
) => gameMoment({ period, gameClock, teamScore, opponentScore });

describe("gameMoment", () => {
  it("returns null without a period or a readable clock", () => {
    expect(gameMoment({ period: null, gameClock: "2:51" })).toBeNull();
    expect(gameMoment({ period: 2, gameClock: null })).toBeNull();
    expect(gameMoment({ period: 2, gameClock: "soon" })).toBeNull();
  });

  it("splits Q1 to Q3 into early, late and the final minute", () => {
    expect(at(1, "10:12")).toBe("Early Q1");
    expect(at(1, "6:01")).toBe("Early Q1");
    expect(at(1, "6:00")).toBe("Late Q1");
    expect(at(2, "1:01")).toBe("Late Q2");
    expect(at(2, "1:00")).toBe("Final minute of Q2");
    expect(at(3, "0:09.6")).toBe("Final minute of Q3");
  });

  it("calls the last five minutes of a close game clutch time", () => {
    expect(at(4, "1:57", 100, 99)).toBe("Clutch time");
    expect(at(4, "5:00", 90, 95)).toBe("Clutch time");
    expect(at(5, "2:54", 108, 103)).toBe("Clutch time");
    // a six-point game, one basket from over (LeBron, 20 Oct 2026)
    expect(at(4, "1:13", 104, 98)).toBe("Clutch time");
  });

  it("counts a shot that would have brought it within five as clutch", () => {
    const shot = (clock: string, us: number, them: number, type: string) =>
      gameMoment({
        period: 4,
        gameClock: clock,
        teamScore: us,
        opponentScore: them,
        types: [{ name: type }],
      });
    expect(shot("3:00", 90, 97, "Three point")).toBe("Clutch time");
    expect(shot("3:00", 90, 97, "Layup")).toBe("Clutch time");
    expect(shot("3:00", 90, 98, "Layup")).toBe("Late Q4");
    expect(shot("0:59", 97, 106, "Three point")).toBe("Late Q4");
    expect(shot("3:00", 90, 97, "Free throw")).toBe("Late Q4");
  });

  it("needs a one-possession game in the last 24 seconds", () => {
    expect(at(4, "0:09.8", 111, 118)).toBe("Late Q4");
    expect(
      gameMoment({
        period: 4,
        gameClock: "0:09.8",
        teamScore: 111,
        opponentScore: 118,
        types: [{ name: "Three point" }],
      }),
    ).toBe("Late Q4");
    expect(at(4, "0:20", 100, 103)).toBe("Clutch time");
    expect(at(4, "0:20", 100, 105)).toBe("Late Q4");
  });

  it("does not call clutch before five minutes are left or when the margin is wider", () => {
    expect(at(4, "5:01", 90, 92)).toBe("Late Q4");
    expect(at(4, "3:00", 90, 97)).toBe("Late Q4");
    expect(at(4, "3:00")).toBe("Late Q4");
  });

  it("calls a decided fourth quarter garbage time", () => {
    expect(at(4, "10:30", 80, 105)).toBe("Garbage time");
    expect(at(4, "10:30", 80, 104)).toBe("Early Q4");
    expect(at(4, "8:00", 100, 80)).toBe("Garbage time");
    expect(at(4, "4:25", 97, 134)).toBe("Garbage time");
    expect(at(4, "4:25", 97, 106)).toBe("Late Q4");
  });

  it("names overtime that is not close", () => {
    expect(at(5, "1:00", 120, 110)).toBe("Overtime");
    expect(at(6, "4:00")).toBe("Overtime");
  });
});

describe("gameTimeline", () => {
  it("places the moment within its quarter", () => {
    const t = gameTimeline({ period: 2, gameClock: "0:09.6" })!;
    expect(t.segments).toEqual(["Q1", "Q2", "Q3", "Q4"]);
    expect(t.active).toBe(1);
    expect(t.progress).toBeCloseTo(1 - 9.6 / 720);
    expect(t.label).toBe("Final minute of Q2");
    expect(t.tone).toBe("normal");
  });

  it("adds overtime segments and measures them in five minutes", () => {
    const t = gameTimeline({
      period: 6,
      gameClock: "2:30",
      teamScore: 120,
      opponentScore: 118,
    })!;
    expect(t.segments).toEqual(["Q1", "Q2", "Q3", "Q4", "OT", "2OT"]);
    expect(t.active).toBe(5);
    expect(t.progress).toBeCloseTo(0.5);
    expect(t.tone).toBe("clutch");
  });

  it("marks garbage time and returns null without a clock", () => {
    expect(
      gameTimeline({
        period: 4,
        gameClock: "4:25",
        teamScore: 97,
        opponentScore: 134,
      })!.tone,
    ).toBe("garbage");
    expect(gameTimeline({ period: 4, gameClock: null })).toBeNull();
  });
});
