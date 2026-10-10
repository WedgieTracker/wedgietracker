import { describe, expect, it } from "vitest";
import {
  buildAllWedgiesQuery,
  parseAllWedgiesQuery,
  seasonFromParam,
  slugify,
} from "./allWedgiesUrl";

/** A minimal stand-in for URLSearchParams, which this package has no DOM types for. */
const params = (query: string) => {
  const entries = new Map(
    query
      .split("&")
      .filter(Boolean)
      .map((pair) => {
        const [key = "", value = ""] = pair.split("=");
        return [key, decodeURIComponent(value.replace(/\+/g, " "))];
      }),
  );
  return { get: (name: string) => entries.get(name) ?? null };
};

describe("slugify", () => {
  it("makes readable, accent-free slugs", () => {
    expect(slugify("Three point")).toBe("three-point");
    expect(slugify("Luka Dončić")).toBe("luka-doncic");
    expect(slugify("Clutch time")).toBe("clutch-time");
  });
});

describe("buildAllWedgiesQuery", () => {
  it("writes readable parameters", () => {
    expect(buildAllWedgiesQuery({ season: "2025/26", wedgie: 74 })).toBe(
      "season=2025-26&wedgie=74",
    );
    expect(
      buildAllWedgiesQuery({
        season: "",
        playerOrTeam: "Cooper Flagg",
        type: "Three point",
        moment: "Clutch time",
      }),
    ).toBe("season=all&player=cooper-flagg&type=three-point&when=clutch-time");
  });

  it("writes team codes as team", () => {
    expect(buildAllWedgiesQuery({ playerOrTeam: "LAL" })).toBe("team=lal");
  });

  it("leaves out what is not set", () => {
    expect(buildAllWedgiesQuery({})).toBe("");
  });
});

describe("parseAllWedgiesQuery", () => {
  const lookup = {
    types: ["Three point", "Layup"],
    players: ["Luka Dončić", "Cooper Flagg"],
  };

  it("reads the readable parameters back", () => {
    expect(
      parseAllWedgiesQuery(
        params("season=2025-26&wedgie=74&type=three-point&when=clutch-time"),
        lookup,
      ),
    ).toEqual({
      season: "2025/26",
      wedgie: 74,
      type: "Three point",
      moment: "Clutch time",
    });
    expect(parseAllWedgiesQuery(params("player=luka-doncic"), lookup)).toEqual({
      playerOrTeam: "Luka Dončić",
    });
    expect(parseAllWedgiesQuery(params("team=lal&season=all"), lookup)).toEqual(
      {
        season: "",
        playerOrTeam: "LAL",
      },
    );
  });

  it("still reads the short parameters from older links", () => {
    expect(parseAllWedgiesQuery(params("ws=2025%2F26&wn=74&wt=LAL"))).toEqual({
      season: "2025/26",
      wedgie: 74,
      playerOrTeam: "LAL",
    });
    expect(parseAllWedgiesQuery(params("wp=Cooper Flagg"), lookup)).toEqual({
      playerOrTeam: "Cooper Flagg",
    });
  });

  it("round-trips through build and parse", () => {
    const state = {
      season: "2024/25",
      wedgie: 12,
      playerOrTeam: "Luka Dončić",
      type: "Layup",
      moment: "Garbage time",
    };
    expect(
      parseAllWedgiesQuery(params(buildAllWedgiesQuery(state)), lookup),
    ).toEqual(state);
  });

  it("converts season params either way", () => {
    expect(seasonFromParam("2025-26")).toBe("2025/26");
    expect(seasonFromParam("2025/26")).toBe("2025/26");
  });
});
