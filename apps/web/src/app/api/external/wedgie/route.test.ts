import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/env", () => ({ env: { WEDGIETRACKER_API_KEY: "tracker-key" } }));
vi.mock("~/server/cache", () => ({
  invalidateWedgieData: vi.fn(),
  invalidateStoreData: vi.fn(),
}));
const syncWedgieTypes = vi.fn();
const maybeUpdateGlobalWedgieCount = vi.fn();
vi.mock("~/server/db-helpers", () => ({
  syncWedgieTypes,
  maybeUpdateGlobalWedgieCount,
}));
vi.mock("@wedgietracker/core/schema", () => ({
  game: { name: "name" },
  player: {},
  team: {},
  wedgie: { id: "id", seasonName: "seasonName", number: "number" },
}));

const wedgieFindFirst = vi.fn();
const gameFindFirst = vi.fn();
const gameFindMany = vi.fn();
const inserted: unknown[] = [];
const returning = vi.fn();
const deleteReturning = vi.fn();
const updateSet = vi.fn(() => ({
  where: () => ({ returning: () => [{ id: 9 }] }),
}));
vi.mock("~/server/db", () => ({
  db: {
    query: {
      wedgie: { findFirst: wedgieFindFirst },
      game: { findFirst: gameFindFirst, findMany: gameFindMany },
    },
    insert: () => ({
      values: (v: unknown) => {
        inserted.push(v);
        return { onConflictDoNothing: () => undefined, returning };
      },
    }),
    update: () => ({ set: updateSet }),
    delete: () => ({ where: () => ({ returning: deleteReturning }) }),
  },
}));

const { POST, PATCH, DELETE } = await import("./route");

const url = "https://www.wedgietracker.com/api/external/wedgie";
const call = (method: string, body: unknown, key = "tracker-key") =>
  new Request(url, {
    method,
    headers: { "x-api-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const draft = {
  seasonName: "2026/27",
  number: 3,
  playerName: "Karl-Anthony Towns",
  teamName: "NYK",
  teamAgainstName: "SAS",
  gameName: "NYK @ SAS - 2026-11-09T00:30:00Z",
  position: { x: 48.4, y: 89.7 },
  types: ["Layup"],
  videoUrl: { cloudinary: "https://res.cloudinary.com/x/video.mp4" },
  period: 2,
  gameClock: "0:09.6",
  teamScore: 63,
  opponentScore: 57,
  noDunksTweet: { id: "1", text: "wedgie", postedAt: "2026-11-09T02:00:00Z" },
};
const siteGame = {
  name: "NYK @ SAS - 2026-11-08T20:30:00Z",
  createdAt: "2026-11-08T20:30:00.000Z",
};

describe("/api/external/wedgie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inserted.length = 0;
    wedgieFindFirst.mockResolvedValue(undefined);
    gameFindFirst.mockResolvedValue(undefined);
    gameFindMany.mockResolvedValue([siteGame]);
    returning.mockResolvedValue([{ id: 9 }]);
  });

  it("refuses a wrong key", async () => {
    const res = await POST(call("POST", draft, "nope"));
    expect(res.status).toBe(401);
  });

  it("adds the wedgie on the site's own game, dated by it", async () => {
    const res = await POST(call("POST", draft));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ created: true });
    const record = inserted.find(
      (v) => (v as { number?: number }).number === 3,
    );
    expect(record).toMatchObject({
      gameName: siteGame.name,
      wedgieDate: "2026-11-08T20:30:00.000Z",
      gameClock: "0:09.6",
      teamScore: 63,
    });
    expect(syncWedgieTypes).toHaveBeenCalledWith(expect.anything(), 9, [
      "Layup",
    ]);
    expect(maybeUpdateGlobalWedgieCount).toHaveBeenCalledWith(
      expect.anything(),
      "2026/27",
    );
  });

  it("writes nothing on a dry run", async () => {
    const res = await POST(call("POST", { ...draft, dryRun: true }));
    expect(await res.json()).toMatchObject({ dryRun: true });
    expect(inserted).toHaveLength(0);
  });

  it("returns the wedgie already there instead of adding it twice", async () => {
    wedgieFindFirst.mockResolvedValue({ id: 4, number: 3 });
    const res = await POST(call("POST", draft));
    expect(await res.json()).toEqual({
      created: false,
      wedgie: { id: 4, number: 3 },
    });
    expect(inserted).toHaveLength(0);
  });

  it("refuses a game that is not in the game list", async () => {
    gameFindMany.mockResolvedValue([]);
    const res = await POST(call("POST", draft));
    expect(res.status).toBe(400);
  });

  it("merges video links", async () => {
    wedgieFindFirst.mockResolvedValue({
      id: 9,
      videoUrl: { cloudinary: "https://c/v.mp4" },
    });
    const res = await PATCH(
      call("PATCH", {
        seasonName: "2026/27",
        number: 3,
        videoUrl: { youtube: "https://youtu.be/x" },
      }),
    );
    expect(res.status).toBe(200);
    expect(updateSet).toHaveBeenCalledWith({
      videoUrl: {
        cloudinary: "https://c/v.mp4",
        youtube: "https://youtu.be/x",
      },
    });
  });

  it("undoes a wedgie", async () => {
    deleteReturning.mockResolvedValue([{ id: 9 }]);
    const res = await DELETE(
      call("DELETE", { seasonName: "2026/27", number: 3 }),
    );
    expect(await res.json()).toMatchObject({ deleted: true });
  });
});
