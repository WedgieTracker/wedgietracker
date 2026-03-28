import { describe, it, expect, vi } from "vitest";

// Mock modules that trigger env validation before importing the module under test
vi.mock("./db", () => ({ db: {} }));
vi.mock("./schema", () => ({ global: {}, wedgie: {} }));
vi.mock("~/utils/paceCalculator", () => ({ calculatePace: vi.fn() }));

const { buildTeamStandings } = await import("./db-helpers");

describe("buildTeamStandings", () => {
  const sampleWedgies = [
    { teamName: "Lakers", teamAgainstName: "Celtics" },
    { teamName: "Lakers", teamAgainstName: "Warriors" },
    { teamName: "Celtics", teamAgainstName: "Lakers" },
    { teamName: "Warriors", teamAgainstName: "Celtics" },
  ];

  it("counts both team and opponent appearances by default", () => {
    const standings = buildTeamStandings(sampleWedgies);
    const lakersEntry = standings.find((s) => s.name === "Lakers");
    // Lakers: 2 as team + 1 as opponent = 3
    expect(lakersEntry?.count).toBe(3);
  });

  it("sorts by count descending, then name ascending", () => {
    const standings = buildTeamStandings(sampleWedgies);
    expect(standings[0]?.name).toBe("Celtics"); // 3 (1 team + 2 opponent)
    expect(standings[0]?.count).toBe(3);
    // Lakers also has 3, but "L" comes after "C"
    expect(standings[1]?.name).toBe("Lakers");
    expect(standings[1]?.count).toBe(3);
    expect(standings[2]?.name).toBe("Warriors");
    expect(standings[2]?.count).toBe(2);
  });

  it("excludes opponents when includeOpponents is false", () => {
    const standings = buildTeamStandings(sampleWedgies, {
      includeOpponents: false,
    });
    expect(standings).toHaveLength(3);
    const lakersEntry = standings.find((s) => s.name === "Lakers");
    expect(lakersEntry?.count).toBe(2); // only as team
    const celticsEntry = standings.find((s) => s.name === "Celtics");
    expect(celticsEntry?.count).toBe(1);
  });

  it("respects the limit option", () => {
    const standings = buildTeamStandings(sampleWedgies, { limit: 2 });
    expect(standings).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    const standings = buildTeamStandings([]);
    expect(standings).toEqual([]);
  });

  it("handles a single wedgie", () => {
    const standings = buildTeamStandings([
      { teamName: "Heat", teamAgainstName: "Knicks" },
    ]);
    expect(standings).toEqual([
      { name: "Heat", count: 1 },
      { name: "Knicks", count: 1 },
    ]);
  });

  it("handles same team appearing as both team and opponent", () => {
    const wedgies = [{ teamName: "Lakers", teamAgainstName: "Lakers" }];
    const standings = buildTeamStandings(wedgies);
    expect(standings).toEqual([{ name: "Lakers", count: 2 }]);
  });
});
