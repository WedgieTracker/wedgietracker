import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// --- Mocks ----------------------------------------------------------------
// The router imports things that touch env validation / network at module
// load. Stub them all before the dynamic import.

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}));

// next-auth pulls in next/server via subpath that vitest's resolver can't
// find. The router never calls auth() directly — `getSession` is provided by
// the test context — so a stub is enough to break the import chain.
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));

const invalidateWedgieData = vi.fn();
const invalidateStoreData = vi.fn();
vi.mock("~/server/cache", () => ({
  CACHE_TAGS: { WEDGIE_DATA: "wedgie-data", STORE_DATA: "store-data" },
  invalidateWedgieData,
  invalidateStoreData,
}));

const buildTeamStandings = vi.fn(() => []);
const maybeUpdateGlobalWedgieCount = vi.fn();
vi.mock("~/server/db-helpers", () => ({
  buildTeamStandings,
  maybeUpdateGlobalWedgieCount,
}));

vi.mock("~/server/schema", () => ({
  wedgie: { id: "id", playerName: "playerName", seasonName: "seasonName" },
  type: { id: "id", name: "name" },
  wedgieToType: { wedgieId: "wedgieId", typeId: "typeId" },
  global: { id: "id" },
  season: { name: "name" },
  game: { createdAt: "createdAt", live: "live" },
}));

// Drizzle chain stubs — each chain ends in one of these settable fns.
const insertReturning = vi.fn();
const updateReturning = vi.fn();
const deleteReturning = vi.fn();
const queryWedgieFindFirst = vi.fn();
const queryTypeFindFirst = vi.fn();
const deleteWhere = vi.fn();
const selectFromWhere = vi.fn();

const fakeDb = {
  insert: vi.fn(() => ({
    values: vi.fn(() => ({ returning: insertReturning })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({ returning: updateReturning })),
    })),
  })),
  delete: vi.fn(() => ({
    where: deleteWhere,
  })),
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({ where: selectFromWhere })),
      where: selectFromWhere,
    })),
  })),
  query: {
    wedgie: { findFirst: queryWedgieFindFirst },
    type: { findFirst: queryTypeFindFirst },
  },
};

vi.mock("~/server/db", () => ({ db: fakeDb }));

const { wedgieRouter } = await import("./wedgie");
const { createCallerFactory } = await import("~/server/api/trpc");

const createCaller = createCallerFactory(wedgieRouter);

function authedCaller() {
  return createCaller({
    db: fakeDb as never,
    getSession: () =>
      Promise.resolve({
        user: { id: "u1", email: "admin@test" },
        expires: "2099-01-01",
      }),
  } as never);
}

function anonCaller() {
  return createCaller({
    db: fakeDb as never,
    getSession: () => Promise.resolve(null),
  } as never);
}

const sampleInput = {
  playerName: "LeBron",
  teamName: "Lakers",
  teamAgainstName: "Celtics",
  number: 123,
  seasonName: "2025/26",
  wedgieDate: new Date("2026-01-15T20:00:00.000Z"),
  position: { x: 0.5, y: 0.6 },
  videoUrl: { youtube: "https://yt/abc" },
  types: ["clutch", "crossover"],
};

// --- Tests ----------------------------------------------------------------

describe("wedgieRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildTeamStandings.mockReturnValue([]);
    // Defaults that satisfy the type-sync helper inside `create` / `update`.
    queryTypeFindFirst.mockResolvedValue({ id: 99, name: "existing" });
    deleteWhere.mockResolvedValue(undefined);
  });

  describe("hello", () => {
    it("greets the input", async () => {
      const result = await anonCaller().hello({ text: "world" });
      expect(result).toEqual({ greeting: "Hello world" });
    });
  });

  describe("auth gating", () => {
    it("rejects create when no session", async () => {
      await expect(anonCaller().create(sampleInput)).rejects.toBeInstanceOf(
        TRPCError,
      );
    });

    it("rejects delete when no session", async () => {
      await expect(anonCaller().delete({ id: "1" })).rejects.toBeInstanceOf(
        TRPCError,
      );
    });

    it("rejects getById when no session", async () => {
      await expect(anonCaller().getById({ id: "1" })).rejects.toBeInstanceOf(
        TRPCError,
      );
    });
  });

  describe("create", () => {
    it("inserts the wedgie, syncs types, updates global, invalidates caches", async () => {
      insertReturning.mockResolvedValueOnce([{ id: 7, playerName: "LeBron" }]);

      const result = await authedCaller().create(sampleInput);

      expect(result).toEqual({ id: 7, playerName: "LeBron" });
      expect(fakeDb.insert).toHaveBeenCalled();
      expect(maybeUpdateGlobalWedgieCount).toHaveBeenCalledWith(
        fakeDb,
        "2025/26",
      );
      expect(invalidateWedgieData).toHaveBeenCalledOnce();
      expect(invalidateStoreData).toHaveBeenCalledOnce();
    });

    it("skips type sync when insert returns nothing", async () => {
      insertReturning.mockResolvedValueOnce([]);

      const result = await authedCaller().create(sampleInput);

      expect(result).toBeUndefined();
      // delete-on-wedgieToType is the first call inside syncWedgieTypes — it
      // should never run if there's no created row.
      expect(fakeDb.delete).not.toHaveBeenCalled();
      // Global count + cache invalidation still run (callers depend on it).
      expect(maybeUpdateGlobalWedgieCount).toHaveBeenCalledOnce();
      expect(invalidateWedgieData).toHaveBeenCalledOnce();
    });

    it("defaults position to {x:0,y:0} when null", async () => {
      insertReturning.mockResolvedValueOnce([{ id: 1 }]);
      const setSpy = vi.fn<
        (values: unknown) => { returning: typeof insertReturning }
      >(() => ({ returning: insertReturning }));
      fakeDb.insert.mockImplementationOnce(() => ({ values: setSpy }) as never);

      await authedCaller().create({ ...sampleInput, position: null });

      const inserted = setSpy.mock.calls[0]?.[0] as { position: unknown };
      expect(inserted.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe("update", () => {
    it("updates the wedgie, syncs types, invalidates wedgie cache only", async () => {
      updateReturning.mockResolvedValueOnce([{ id: 7 }]);

      const result = await authedCaller().update({
        id: 7,
        data: sampleInput,
      });

      expect(result).toEqual({ id: 7 });
      expect(fakeDb.update).toHaveBeenCalled();
      expect(maybeUpdateGlobalWedgieCount).toHaveBeenCalledOnce();
      expect(invalidateWedgieData).toHaveBeenCalledOnce();
      // update doesn't touch the store
      expect(invalidateStoreData).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes by id and invalidates both caches", async () => {
      deleteWhere.mockReturnValueOnce({ returning: deleteReturning });
      deleteReturning.mockResolvedValueOnce([{ id: 7 }]);

      const result = await authedCaller().delete({ id: "7" });

      expect(result).toEqual({ id: 7 });
      expect(invalidateWedgieData).toHaveBeenCalledOnce();
      expect(invalidateStoreData).toHaveBeenCalledOnce();
    });
  });

  describe("getById", () => {
    it("returns null when no wedgie matches", async () => {
      queryWedgieFindFirst.mockResolvedValueOnce(undefined);

      const result = await authedCaller().getById({ id: "9999" });

      expect(result).toBeNull();
    });

    it("returns the wedgie with its types", async () => {
      queryWedgieFindFirst.mockResolvedValueOnce({
        id: 7,
        playerName: "LeBron",
      });
      // Mock the join select inside getWedgiesWithTypes:
      // db.select(...).from(wedgieToType).innerJoin(type, ...).where(...) → rows
      selectFromWhere.mockResolvedValueOnce([
        {
          wedgieId: 7,
          typeId: 1,
          typeName: "clutch",
          typeCreatedAt: "2026-01-01",
          typeUpdatedAt: "2026-01-01",
        },
      ]);

      const result = await authedCaller().getById({ id: "7" });

      expect(result).toMatchObject({
        id: 7,
        playerName: "LeBron",
        types: [
          {
            id: 1,
            name: "clutch",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
      });
    });
  });
});
