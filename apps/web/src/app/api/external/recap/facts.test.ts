import { describe, it, expect } from "vitest";
import {
  nightFacts,
  previousWedgie,
  wedgieFacts,
  type PastWedgie,
} from "./facts";

const openingNights = {
  "2014/15": "2014-10-28",
  "2019/20": "2019-10-22",
  "2026/27": "2026-10-20",
};
const lebron = (seasonName: string, number: number, date: string) => ({
  seasonName,
  number,
  playerName: "LeBron James",
  teamName: "PHI",
  date,
});

describe("wedgieFacts", () => {
  const history: PastWedgie[] = [
    lebron("2014/15", 3, "2014-11-05"),
    lebron("2019/20", 8, "2019-12-01"),
    lebron("2026/27", 1, "2026-10-20"),
  ];
  const facts = wedgieFacts(history[2]!, history, openingNights);
  const text = facts.map((f) => f.text);

  it("calls out the first wedgie of a season on opening night", () => {
    expect(text).toContain("First wedgie of the 2026/27 season");
    expect(text).toContain(
      "First opening-night wedgie since we started tracking in 2014/15",
    );
  });

  it("counts the career and the gap since the last one", () => {
    expect(facts).toContainEqual({
      text: "LeBron James's 3rd career wedgie and first since 2019/20",
      notable: true,
    });
  });

  it("keeps the team count but does not flag it", () => {
    expect(facts).toContainEqual({
      text: "PHI's 1st wedgie of the season",
      notable: false,
    });
  });

  it("counts earlier opening nights by season", () => {
    const withEarlier = [
      { ...lebron("2019/20", 1, "2019-10-22"), playerName: "A" },
      { ...lebron("2019/20", 2, "2019-10-22"), playerName: "B" },
      ...history,
    ];
    expect(
      wedgieFacts(history[2]!, withEarlier, openingNights).map((f) => f.text),
    ).toContain("Opening-night wedgie, the 2nd since 2014/15");
  });

  it("flags a first career wedgie", () => {
    const rookie = { ...lebron("2026/27", 2, "2026-10-21"), playerName: "R" };
    expect(wedgieFacts(rookie, [rookie], openingNights)).toContainEqual({
      text: "R's first career wedgie",
      notable: true,
    });
  });
});

describe("nightFacts", () => {
  it("says nothing about a one-wedgie night", () => {
    expect(nightFacts("2026-10-20", 1, [])).toEqual([]);
  });

  it("marks a record night", () => {
    const past = [
      lebron("2019/20", 1, "2019-11-01"),
      lebron("2019/20", 2, "2019-11-01"),
    ];
    expect(nightFacts("2026-10-21", 3, past)[0]?.text).toBe(
      "3 wedgies in one night, the most we have ever tracked",
    );
  });
});

describe("previousWedgie", () => {
  const history = [
    lebron("2014/15", 3, "2014-11-05"),
    lebron("2019/20", 8, "2019-12-01"),
    lebron("2026/27", 1, "2026-10-20"),
  ];

  it("finds the player's most recent earlier wedgie", () => {
    expect(previousWedgie(history[2]!, history)?.date).toBe("2019-12-01");
  });

  it("is undefined for a first career wedgie", () => {
    expect(previousWedgie(history[0]!, history)).toBeUndefined();
  });
});
