import { describe, it, expect, vi, beforeEach } from "vitest";

const env = { REPORTS_API_KEY: "secret-key" as string | undefined };
vi.mock("~/env", () => ({ env }));

const findMany = vi.fn();
const updateWhere = vi.fn();
const updateSet = vi.fn(() => ({ where: updateWhere }));
vi.mock("~/server/db", () => ({
  db: {
    query: { wedgieReport: { findMany } },
    update: () => ({ set: updateSet }),
  },
}));
vi.mock("@wedgietracker/core/schema", () => ({
  wedgieReport: { id: "id", resolved: "resolved", createdAt: "createdAt" },
}));

const { GET, POST } = await import("./route");

const url = "https://www.wedgietracker.com/api/reports";
const auth = { authorization: "Bearer secret-key" };

describe("/api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.REPORTS_API_KEY = "secret-key";
    findMany.mockResolvedValue([{ id: 1, field: "player" }]);
  });

  it("lists open reports with the key", async () => {
    const res = await GET(new Request(url, { headers: auth }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reports: [{ id: 1, field: "player" }] });
  });

  it("404s without the right key", async () => {
    const res = await GET(
      new Request(url, { headers: { authorization: "Bearer nope" } }),
    );
    expect(res.status).toBe(404);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("404s when no key is configured", async () => {
    env.REPORTS_API_KEY = undefined;
    const res = await GET(
      new Request(url, { headers: { authorization: "Bearer " } }),
    );
    expect(res.status).toBe(404);
  });

  it("resolves a report", async () => {
    const res = await POST(
      new Request(url, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ id: 3, resolved: true }),
      }),
    );
    expect(res.status).toBe(200);
    expect(updateSet).toHaveBeenCalledWith({ resolved: true });
  });

  it("rejects a malformed body", async () => {
    const res = await POST(
      new Request(url, { method: "POST", headers: auth, body: "{}" }),
    );
    expect(res.status).toBe(400);
    expect(updateSet).not.toHaveBeenCalled();
  });
});
