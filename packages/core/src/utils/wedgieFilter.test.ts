import { describe, it, expect } from "vitest";
import {
  matchesFilter,
  matchesMoment,
  matchesPlayerOrTeam,
} from "./wedgieFilter";
import type { WedgieWithTypes } from "../types/wedgie";

function makeWedgie(overrides: Partial<WedgieWithTypes> = {}): WedgieWithTypes {
  return {
    id: 1,
    playerName: null,
    teamName: null,
    teamAgainstName: null,
    types: [],
    ...overrides,
  } as unknown as WedgieWithTypes;
}

describe("matchesPlayerOrTeam", () => {
  it("'MIL' matches a wedgie where teamName is MIL", () => {
    const wedgie = makeWedgie({ teamName: "MIL", teamAgainstName: "BOS" });
    expect(matchesPlayerOrTeam(wedgie, "MIL")).toBe(true);
  });

  it("'MIL' matches a wedgie where teamAgainstName is MIL", () => {
    const wedgie = makeWedgie({ teamName: "BOS", teamAgainstName: "MIL" });
    expect(matchesPlayerOrTeam(wedgie, "MIL")).toBe(true);
  });

  it("'MIL' does NOT match a wedgie whose only connection to 'mil' is playerName 'Miles Bridges'", () => {
    const wedgie = makeWedgie({
      playerName: "Miles Bridges",
      teamName: "CHA",
      teamAgainstName: "DET",
    });
    expect(matchesPlayerOrTeam(wedgie, "MIL")).toBe(false);
  });

  it("'LA' matches a Lakers wedgie (LAL)", () => {
    const wedgie = makeWedgie({ teamName: "LAL", teamAgainstName: "GSW" });
    expect(matchesPlayerOrTeam(wedgie, "LA")).toBe(true);
  });

  it("'LA' matches a Clippers wedgie (LAC)", () => {
    const wedgie = makeWedgie({ teamName: "BOS", teamAgainstName: "LAC" });
    expect(matchesPlayerOrTeam(wedgie, "LA")).toBe(true);
  });

  it("'LA' does NOT match a non-LA wedgie", () => {
    const wedgie = makeWedgie({ teamName: "MIL", teamAgainstName: "BOS" });
    expect(matchesPlayerOrTeam(wedgie, "LA")).toBe(false);
  });

  it("unresolved query falls back to substring match on playerName (e.g. 'Hawkins')", () => {
    const wedgie = makeWedgie({
      playerName: "Ron Hawkins",
      teamName: "DAL",
      teamAgainstName: "SAS",
    });
    expect(matchesPlayerOrTeam(wedgie, "Hawkins")).toBe(true);
  });

  it("nickname query 'Bucks' resolves to MIL and matches a MIL wedgie", () => {
    const wedgie = makeWedgie({ teamName: "MIL", teamAgainstName: "BOS" });
    expect(matchesPlayerOrTeam(wedgie, "Bucks")).toBe(true);
  });
});

describe("matchesFilter", () => {
  it("empty filters match everything", () => {
    const wedgie = makeWedgie({ playerName: "Shaq", teamName: "LAL" });
    expect(matchesFilter(wedgie, { type: "", playerOrTeam: "" })).toBe(true);
  });

  it("type filter works independently", () => {
    const wedgie = makeWedgie({
      types: [{ name: "Classic" }] as WedgieWithTypes["types"],
    });
    expect(matchesFilter(wedgie, { type: "Classic", playerOrTeam: "" })).toBe(
      true,
    );
    expect(matchesFilter(wedgie, { type: "Reverse", playerOrTeam: "" })).toBe(
      false,
    );
  });

  it("playerOrTeam filter works independently", () => {
    const wedgie = makeWedgie({ teamName: "MIL", teamAgainstName: "BOS" });
    expect(matchesFilter(wedgie, { type: "", playerOrTeam: "MIL" })).toBe(true);
    expect(matchesFilter(wedgie, { type: "", playerOrTeam: "LAL" })).toBe(
      false,
    );
  });

  it("type AND playerOrTeam must both match", () => {
    const wedgie = makeWedgie({
      teamName: "MIL",
      teamAgainstName: "BOS",
      types: [{ name: "Classic" }] as WedgieWithTypes["types"],
    });
    expect(
      matchesFilter(wedgie, { type: "Classic", playerOrTeam: "MIL" }),
    ).toBe(true);
    expect(
      matchesFilter(wedgie, { type: "Reverse", playerOrTeam: "MIL" }),
    ).toBe(false);
    expect(
      matchesFilter(wedgie, { type: "Classic", playerOrTeam: "LAL" }),
    ).toBe(false);
  });

  it("type filter is case-insensitive", () => {
    const wedgie = makeWedgie({
      types: [{ name: "Classic" }] as WedgieWithTypes["types"],
    });
    expect(matchesFilter(wedgie, { type: "classic", playerOrTeam: "" })).toBe(
      true,
    );
    expect(matchesFilter(wedgie, { type: "CLASSIC", playerOrTeam: "" })).toBe(
      true,
    );
  });
});

describe("matchesMoment", () => {
  const at = (
    period: number,
    gameClock: string,
    teamScore?: number,
    opponentScore?: number,
  ) => makeWedgie({ period, gameClock, teamScore, opponentScore });

  it("matches quarters whatever the band", () => {
    expect(matchesMoment(at(2, "0:09.6"), "Q2")).toBe(true);
    expect(matchesMoment(at(2, "0:09.6"), "Q3")).toBe(false);
    expect(matchesMoment(at(4, "1:57", 100, 99), "Q4")).toBe(true);
  });

  it("matches the bands", () => {
    expect(matchesMoment(at(4, "1:57", 100, 99), "Clutch time")).toBe(true);
    expect(matchesMoment(at(4, "7:16", 108, 133), "Garbage time")).toBe(true);
    expect(matchesMoment(at(2, "0:09.6"), "Final minute")).toBe(true);
    expect(matchesMoment(at(5, "2:00", 110, 100), "Overtime")).toBe(true);
    expect(matchesMoment(at(4, "8:00", 100, 98), "Clutch time")).toBe(false);
  });

  it("never matches a wedgie without a game clock", () => {
    expect(matchesMoment(makeWedgie(), "Q1")).toBe(false);
  });

  it("is applied by matchesFilter", () => {
    const filters = { type: "", playerOrTeam: "", moment: "Clutch time" };
    expect(matchesFilter(at(4, "1:57", 100, 99), filters)).toBe(true);
    expect(matchesFilter(at(1, "10:00"), filters)).toBe(false);
  });
});
