import { describe, it, expect, vi, beforeEach } from "vitest";
import type * as Drizzle from "drizzle-orm";

vi.mock("~/env", () => ({ env: { WEDGIETRACKER_API_KEY: "tracker-key" } }));

const wedgieFindMany = vi.fn();
const globalFindFirst = vi.fn();
const likeCalls: unknown[] = [];
const history = [
  {
    seasonName: "2026/27",
    number: 1,
    playerName: "Karl-Anthony Towns",
    teamName: "NYK",
    date: "2026-10-20",
  },
];
const openings = [
  { seasonName: "2025/26", date: "2025-10-21", games: 2 },
  { seasonName: "2026/27", date: "2026-10-20", games: 2 },
];
vi.mock("drizzle-orm", async (orig) => ({
  ...(await orig<typeof Drizzle>()),
  like: (col: unknown, pattern: unknown) => {
    likeCalls.push(pattern);
    return {};
  },
}));
vi.mock("~/server/db", () => ({
  db: {
    query: {
      wedgie: { findMany: wedgieFindMany },
      global: { findFirst: globalFindFirst },
    },
    // the season count, the wedgie history, then the opening nights
    select: (cols: Record<string, unknown>) => ({
      from: () => ({
        where: () =>
          "wedgies" in cols
            ? [{ wedgies: 2 }]
            : "playerName" in cols
              ? history
              : { groupBy: () => openings },
      }),
    }),
  },
}));

const { GET } = await import("./route");

const call = (date: string | null, key = "tracker-key") =>
  new Request(
    `https://www.wedgietracker.com/api/external/recap${date ? `?date=${date}` : ""}`,
    { headers: { "x-api-key": key } },
  );

beforeEach(() => {
  vi.clearAllMocks();
  likeCalls.length = 0;
  globalFindFirst.mockResolvedValue({
    currentSeason: { name: "2026/27" },
    currentTotalWedgies: 1,
    currentTotalGames: 3,
    pace: 53,
  });
  wedgieFindMany.mockResolvedValue([
    {
      seasonName: "2026/27",
      number: 1,
      playerName: "Karl-Anthony Towns",
      teamName: "NYK",
      teamAgainstName: "PHI",
      gameName: "NYK @ PHI - 2026-10-20T19:00:00Z",
      period: 2,
      gameClock: "4:12",
      teamScore: 40,
      opponentScore: 38,
      wedgieDate: "2026-10-20T19:00:00.000Z",
      wedgieToTypes: [{ type: { name: "Three point" } }],
      shoutouts: ["nodunksinc"],
      videoUrl: { hosted: "https://media.wedgietracker.com/v/1.mp4" },
    },
  ]);
});

describe("GET /api/external/recap", () => {
  it("rejects a wrong key", async () => {
    const res = await GET(call("2026-10-20", "nope"));
    expect(res.status).toBe(401);
  });

  it("needs a YYYY-MM-DD date", async () => {
    expect((await GET(call(null))).status).toBe(400);
    expect((await GET(call("20-10-2026"))).status).toBe(400);
  });

  it("returns the night's wedgies with links and the season so far", async () => {
    const res = await GET(call("2026-10-20"));
    expect(res.status).toBe(200);
    expect(likeCalls).toEqual(["2026-10-20%"]);
    const body = (await res.json()) as {
      wedgies: {
        url: string;
        types: string[];
        moment: unknown;
        facts: { text: string }[];
        previous: { date: string; seasonName: string } | null;
        leagueGap: unknown;
        firstForTeam: boolean;
      }[];
      season: { name: string; wedgies: number; pace: number };
      pace: unknown;
    };
    expect(body.wedgies[0]?.url).toBe(
      "https://www.wedgietracker.com/all-wedgies?season=2026-27&wedgie=1",
    );
    expect(body.wedgies[0]?.types).toEqual(["Three point"]);
    expect(body.wedgies[0]?.moment).toMatchObject({
      segments: ["Q1", "Q2", "Q3", "Q4"],
      active: 1,
      label: "Late Q2",
    });
    // the only Towns wedgie in the history is this one
    expect(body.wedgies[0]?.previous).toBeNull();
    expect(body.wedgies[0]?.leagueGap).toBeNull();
    expect(body.wedgies[0]?.firstForTeam).toBe(false);
    expect(body.pace).toEqual({
      season: "2026/27",
      wedgies: 1,
      games: 2,
      lastSeason: {
        name: "2025/26",
        wedgies: 0,
        games: 2,
        wedgiesAtSameGames: 0,
      },
    });
    expect(body.wedgies[0]?.facts.map((f) => f.text)).toContain(
      "First wedgie of the 2026/27 season",
    );
    expect(body.season).toEqual({
      name: "2026/27",
      wedgies: 2,
      gamesPlayed: 3,
      pace: 53,
    });
  });
});
