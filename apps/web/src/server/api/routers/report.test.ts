import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// See wedgie.test.ts: break the next-auth import chain before loading the router.
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));

const sendTelegramMessage = vi.fn();
vi.mock("~/server/services/telegram", () => ({ sendTelegramMessage }));

vi.mock("@wedgietracker/core/schema", () => ({
  wedgie: { id: "id" },
  wedgieReport: {
    id: "id",
    wedgieId: "wedgieId",
    resolved: "resolved",
    createdAt: "createdAt",
  },
}));

const insertValues = vi.fn();
const selectWhere = vi.fn();
const queryWedgieFindFirst = vi.fn();

const fakeDb = {
  insert: vi.fn(() => ({ values: insertValues })),
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere })) })),
  query: { wedgie: { findFirst: queryWedgieFindFirst } },
};

vi.mock("~/server/db", () => ({ db: fakeDb }));

const { reportRouter } = await import("./report");
const { createCallerFactory } = await import("~/server/api/trpc");

const anonCaller = () =>
  createCallerFactory(reportRouter)({
    db: fakeDb as never,
    getSession: () => Promise.resolve(null),
  });

const target = {
  id: 7,
  number: 12,
  seasonName: "2026/27",
  playerName: "Jokic <3",
  teamName: "Nuggets",
  teamAgainstName: "Jazz",
};

describe("reportRouter.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryWedgieFindFirst.mockResolvedValue(target);
    selectWhere.mockResolvedValue([{ count: 0 }]);
  });

  it("stores the report and pings Telegram with escaped text", async () => {
    await anonCaller().create({
      wedgieId: 7,
      field: "player",
      note: " wrong guy & team ",
    });

    expect(insertValues).toHaveBeenCalledWith({
      wedgieId: 7,
      field: "player",
      note: "wrong guy & team",
    });
    const message = sendTelegramMessage.mock.calls[0]![0] as string;
    expect(message).toContain("wedgie #12");
    expect(message).toContain("Jokic &lt;3");
    expect(message).toContain("Note: wrong guy &amp; team");
    expect(message).toContain("/admin/wedgies/7");
  });

  it("leaves Telegram alone when the reports API is read instead", async () => {
    vi.stubEnv("REPORTS_API_KEY", "k");
    await anonCaller().create({ wedgieId: 7, field: "player" });
    vi.unstubAllEnvs();
    expect(insertValues).toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("stores a null note when it is blank", async () => {
    await anonCaller().create({ wedgieId: 7, field: "video", note: "   " });
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ note: null }),
    );
  });

  it("silently drops honeypot submissions", async () => {
    const result = await anonCaller().create({
      wedgieId: 7,
      field: "other",
      website: "spam.example",
    });
    expect(result).toEqual({ ok: true });
    expect(insertValues).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("stops storing once a wedgie has too many open reports", async () => {
    selectWhere.mockResolvedValue([{ count: 10 }]);
    await anonCaller().create({ wedgieId: 7, field: "date" });
    expect(insertValues).not.toHaveBeenCalled();
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });

  it("404s for an unknown wedgie", async () => {
    queryWedgieFindFirst.mockResolvedValue(undefined);
    await expect(
      anonCaller().create({ wedgieId: 999, field: "type" }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("rejects notes over 500 characters", async () => {
    await expect(
      anonCaller().create({
        wedgieId: 7,
        field: "other",
        note: "x".repeat(501),
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
