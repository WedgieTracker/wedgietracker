import { describe, it, expect, vi, beforeEach } from "vitest";
import type * as Games from "~/server/games";

vi.mock("~/env", () => ({ env: { WEDGIETRACKER_API_KEY: "tracker-key" } }));
vi.mock("~/server/cache", () => ({ invalidateWedgieData: vi.fn() }));
vi.mock("~/server/pace", () => ({
  calculatePace: vi.fn(() => ({ simplePace: 1, rmPace: 1, medianPace: 1 })),
}));
const syncIncomingGames = vi.fn();
vi.mock("~/server/games", async (importActual) => ({
  ...(await importActual<typeof Games>()),
  syncIncomingGames,
}));
const updateSet = vi.fn(() => ({ where: () => undefined }));
vi.mock("~/server/db", () => ({
  db: {
    query: {
      global: {
        findFirst: vi.fn(() => ({
          currentSeasonId: 1,
          currentTotalWedgies: 0,
          currentTotalGames: 0,
        })),
      },
    },
    update: () => ({ set: updateSet }),
  },
}));

const { POST } = await import("./route");

const post = (body: unknown) =>
  POST(
    new Request("https://www.wedgietracker.com/api/external", {
      method: "POST",
      headers: {
        "x-api-key": "tracker-key",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );

const game = (extra: Record<string, unknown> = {}) => ({
  id: "0022600200",
  name: "LAL @ BOS - 2026-11-14T20:00:00Z",
  createdAt: "2026-11-14T20:00:00.000Z",
  seasonName: "2026/27",
  live: false,
  ...extra,
});

describe("POST /api/external newGames", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes a game with tipUtc on to be stored", async () => {
    const sent = game({ tipUtc: "2026-11-15T01:00:00Z" });
    const res = await post({ newGames: [sent] });
    expect(res.status).toBe(200);
    expect(syncIncomingGames).toHaveBeenCalledWith(expect.anything(), [sent]);
  });

  it("takes games without tipUtc, or with it null, as before", async () => {
    const res = await post({ newGames: [game(), game({ tipUtc: null })] });
    expect(res.status).toBe(200);
    expect(syncIncomingGames).toHaveBeenCalledTimes(1);
  });

  it("refuses a tipUtc that isn't an ISO date-time, before writing anything", async () => {
    for (const tipUtc of ["8pm", "2026-11-15", "2026-11-15T01:00:00", 5]) {
      const res = await post({
        newWedgieCount: 4,
        newGames: [game(), game({ name: "A @ B - 2026-11-14", tipUtc })],
      });
      expect(res.status).toBe(400);
      const { error } = (await res.json()) as { error: string };
      expect(error).toMatch(/^tipUtc of A @ B - 2026-11-14 must be/);
    }
    expect(syncIncomingGames).not.toHaveBeenCalled();
    expect(updateSet).not.toHaveBeenCalled();
  });
});
