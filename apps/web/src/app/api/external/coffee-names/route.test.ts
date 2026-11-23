import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({ env: { WEDGIETRACKER_API_KEY: "tracker-key" } }));
const decideBoardName = vi.fn();
const listPendingBoardNames = vi.fn();
vi.mock("~/server/coffee-board", () => ({
  decideBoardName,
  listPendingBoardNames,
}));

const { GET, POST } = await import("./route");

const request = (method: string, body?: unknown, key = "tracker-key") =>
  new Request("https://www.wedgietracker.com/api/external/coffee-names", {
    method,
    headers: { "x-api-key": key, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => vi.clearAllMocks());

describe("/api/external/coffee-names", () => {
  it("needs the key", async () => {
    expect((await GET(request("GET", undefined, "nope"))).status).toBe(401);
    expect((await POST(request("POST", {}, "nope"))).status).toBe(401);
  });

  it("lists the pending names", async () => {
    listPendingBoardNames.mockResolvedValue([{ id: "cs_live_a", name: "Bob" }]);
    const res = await GET(request("GET"));
    expect(await res.json()).toEqual({
      pending: [{ id: "cs_live_a", name: "Bob" }],
    });
  });

  it("passes a decision through, and maps the outcomes", async () => {
    decideBoardName.mockResolvedValueOnce({ result: "ok" });
    const ok = await POST(
      request("POST", { id: "cs_live_a", name: "Bob", status: "approved" }),
    );
    expect(ok.status).toBe(200);
    expect(decideBoardName).toHaveBeenCalledWith(
      "cs_live_a",
      "Bob",
      "approved",
      undefined,
    );

    decideBoardName.mockResolvedValueOnce({
      result: "conflict",
      current: { name: "Bobby", status: "pending" },
    });
    const conflict = await POST(
      request("POST", { id: "cs_live_a", name: "Bob", status: "rejected" }),
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      current: { name: "Bobby", status: "pending" },
    });

    decideBoardName.mockResolvedValueOnce({ result: "not-found" });
    const missing = await POST(
      request("POST", {
        id: "cs_live_z",
        name: "Bob",
        status: "pending",
        from: "approved",
      }),
    );
    expect(missing.status).toBe(404);
    expect(decideBoardName).toHaveBeenLastCalledWith(
      "cs_live_z",
      "Bob",
      "pending",
      "approved",
    );
  });

  it("refuses an undo without what it undoes", async () => {
    const res = await POST(
      request("POST", { id: "cs_live_a", name: "Bob", status: "pending" }),
    );
    expect(res.status).toBe(400);
    expect(decideBoardName).not.toHaveBeenCalled();
  });
});
