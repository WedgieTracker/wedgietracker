import { describe, expect, it } from "vitest";
import {
  easternDay,
  gameColumns,
  gameLabel,
  gameLabelWithDate,
  gameMatchup,
  gameTeamsProblem,
  gameTipEastern,
  parseGameName,
  wedgieDateForGame,
  wedgieDateOnGameDay,
  wedgieGameProblem,
} from "./game";

const rockets = {
  name: "HOU @ POR - 2018-03-24T00:00:00.000Z",
  homeTeam: "HOU",
  awayTeam: "POR",
  gameDate: "2018-03-24",
};

describe("parseGameName", () => {
  it("reads the home team first, as the names are written", () => {
    expect(parseGameName("HOU @ NOP - 2018-03-24T00:00:00.000Z")).toEqual({
      homeTeam: "HOU",
      awayTeam: "NOP",
      gameDate: "2018-03-24",
    });
  });

  it("reads only the teams and day, never a time, and copes with the All-Star names", () => {
    // the time in a name is not a time: the result has no field for one
    expect(parseGameName("NYK @ SAS - 2026-11-08T20:30:00Z")).toEqual({
      homeTeam: "NYK",
      awayTeam: "SAS",
      gameDate: "2026-11-08",
    });
    expect(parseGameName("EST @ WST - 2024-02-18T20:00:00")).toEqual({
      homeTeam: "EST",
      awayTeam: "WST",
      gameDate: "2024-02-18",
    });
    expect(parseGameName("LAL @ BOS")).toBeNull();
    expect(parseGameName(null)).toBeNull();
  });
});

describe("gameTipEastern", () => {
  it("shows tip_at in US Eastern time, across both DST changes", () => {
    // 01:00 UTC on 15 Nov is 20:00 EST the evening before
    expect(gameTipEastern({ tipAt: "2026-11-15T01:00:00Z" })).toBe("20:00");
    // summer time: 23:30 UTC is 19:30 EDT
    expect(gameTipEastern({ tipAt: "2026-04-10T23:30:00.000Z" })).toBe("19:30");
  });

  it("has no time without tip_at, whatever the name says", () => {
    expect(
      gameTipEastern({
        name: "NYK @ SAS - 2026-11-08T20:30:00Z",
        tipAt: null,
      }),
    ).toBeNull();
    expect(gameTipEastern({})).toBeNull();
    expect(gameTipEastern({ tipAt: "not a time" })).toBeNull();
  });
});

describe("easternDay", () => {
  it("is the Eastern day, which is the day before for an early-UTC tip-off", () => {
    expect(easternDay("2026-11-15T01:00:00Z")).toBe("2026-11-14");
    expect(easternDay("2026-11-15T05:00:00Z")).toBe("2026-11-15");
  });
});

describe("game labels", () => {
  it("writes NBA notation, away team first", () => {
    expect(gameLabel(rockets)).toBe("POR @ HOU");
  });

  it("adds the day for the admin's game box", () => {
    expect(gameLabelWithDate(rockets)).toBe("POR @ HOU, 2018-03-24");
  });

  it("says who was at home in plain English", () => {
    expect(gameMatchup(rockets)).toBe("HOU v POR, at HOU");
    expect(gameMatchup(rockets, "POR")).toBe("POR v HOU, at HOU");
  });

  it("falls back to the name on a row whose columns are empty", () => {
    expect(
      gameLabel({ name: rockets.name, homeTeam: null, awayTeam: null }),
    ).toBe("POR @ HOU");
    expect(gameColumns({ name: "something else" })).toBeNull();
    expect(gameLabel({ name: "something else" })).toBe("something else");
  });
});

describe("gameTeamsProblem", () => {
  it("takes the game's two teams in either order", () => {
    expect(
      gameTeamsProblem({ teamName: "HOU", teamAgainstName: "POR" }, rockets),
    ).toBeNull();
    expect(
      gameTeamsProblem({ teamName: "POR", teamAgainstName: "HOU" }, rockets),
    ).toBeNull();
  });

  it("refuses a team or opponent that did not play", () => {
    expect(
      gameTeamsProblem({ teamName: "SAS", teamAgainstName: "POR" }, rockets),
    ).toBe("SAS v POR is not the game POR @ HOU on 2018-03-24 (POR at HOU)");
    expect(
      gameTeamsProblem({ teamName: "HOU", teamAgainstName: "HOU" }, rockets),
    ).not.toBeNull();
  });

  it("leaves All-Star games and GEMS alone", () => {
    const allStar = {
      homeTeam: "EST",
      awayTeam: "WST",
      gameDate: "2015-02-15",
    };
    expect(
      gameTeamsProblem(
        { teamName: "STARS", teamAgainstName: "Unknown Away Team" },
        allStar,
      ),
    ).toBeNull();
    expect(
      gameTeamsProblem(
        { teamName: "NJ", teamAgainstName: "SEA", seasonName: "GEMS" },
        {},
      ),
    ).toBeNull();
  });
});

describe("wedgie dates", () => {
  it("takes noon UTC, Eastern-as-UTC and real UTC times on the game's day", () => {
    expect(wedgieDateOnGameDay("2018-03-24T12:00:00.000Z", "2018-03-24")).toBe(
      true,
    );
    expect(wedgieDateOnGameDay("2018-03-24T00:00:00.000Z", "2018-03-24")).toBe(
      true,
    );
    // 10:30pm Eastern on the 24th is the 25th in UTC
    expect(wedgieDateOnGameDay("2018-03-25T02:30:00.000Z", "2018-03-24")).toBe(
      true,
    );
  });

  it("catches a wedgie stored a day early", () => {
    expect(wedgieDateOnGameDay("2018-03-23T23:00:00.000Z", "2018-03-24")).toBe(
      false,
    );
    expect(wedgieDateOnGameDay("not a date", "2018-03-24")).toBe(false);
  });

  it("dates a wedgie by the game's tip, or noon on its day", () => {
    expect(
      wedgieDateForGame({
        name: "NYK @ SAS - 2026-11-08T20:30:00Z",
        createdAt: "2026-11-08T20:30:00.000Z",
      }),
    ).toBe("2026-11-08T20:30:00.000Z");
    expect(
      wedgieDateForGame({ ...rockets, createdAt: "2018-03-23T23:00:00.000Z" }),
    ).toBe("2018-03-24T12:00:00.000Z");
  });
});

describe("wedgieGameProblem", () => {
  const onRockets = { teamName: "POR", teamAgainstName: "HOU" };

  it("passes a wedgie on the right game and day, or with no date yet", () => {
    expect(
      wedgieGameProblem(
        { ...onRockets, wedgieDate: "2018-03-24T12:00:00.000Z" },
        rockets,
      ),
    ).toBeNull();
    expect(wedgieGameProblem(onRockets, rockets)).toBeNull();
  });

  it("names the teams before the date", () => {
    expect(
      wedgieGameProblem(
        {
          teamName: "SAS",
          teamAgainstName: "HOU",
          wedgieDate: "2018-03-20T12:00:00.000Z",
        },
        rockets,
      ),
    ).toMatch(/^SAS v HOU is not the game POR @ HOU/);
  });

  it("refuses a date off the game's day", () => {
    expect(
      wedgieGameProblem(
        { ...onRockets, wedgieDate: "2018-03-23T12:00:00.000Z" },
        rockets,
      ),
    ).toBe(
      "The date 2018-03-23T12:00:00.000Z is not the day of POR @ HOU (2018-03-24, US Eastern)",
    );
  });
});
