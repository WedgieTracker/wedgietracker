import { describe, it, expect, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import {
  cdnCacheResponseMeta,
  isCdnCacheable,
  CDN_CACHE_CONTROL,
} from "./cdn-cache";

const ok = {
  type: "query" as const,
  paths: ["wedgie.getStats"],
  errors: [],
  eagerGeneration: false,
};

describe("isCdnCacheable", () => {
  it("accepts a single allowlisted query", () => {
    expect(isCdnCacheable(ok)).toBe(true);
  });

  it("accepts a batch made only of allowlisted queries", () => {
    expect(
      isCdnCacheable({
        ...ok,
        paths: ["wedgie.getStats", "admin.getGlobal", "wedgie.getTotalWedgies"],
      }),
    ).toBe(true);
  });

  it("accepts the batches the website and app send", () => {
    expect(
      isCdnCacheable({
        ...ok,
        paths: [
          "admin.getGlobal",
          "season.getAllWithStats",
          "wedgie.getAll",
          "wedgie.getBySeason",
          "donations.getSeasonCoffees",
        ],
      }),
    ).toBe(true);
  });

  it("never caches the admin-only or per-buyer procedures", () => {
    for (const path of [
      "wedgie.getById",
      "donations.listBoardNames",
      "report.list",
      "player.getAll",
    ]) {
      expect(isCdnCacheable({ ...ok, paths: [path] })).toBe(false);
    }
  });

  it("rejects a batch that mixes in a non-allowlisted path", () => {
    expect(
      isCdnCacheable({ ...ok, paths: ["wedgie.getStats", "wedgie.getById"] }),
    ).toBe(false);
  });

  it("rejects mutations, errors, empty and unknown paths", () => {
    expect(isCdnCacheable({ ...ok, type: "mutation" })).toBe(false);
    expect(isCdnCacheable({ ...ok, errors: [new Error("db down")] })).toBe(
      false,
    );
    expect(isCdnCacheable({ ...ok, paths: [] })).toBe(false);
    expect(isCdnCacheable({ ...ok, paths: undefined })).toBe(false);
  });

  it("rejects streamed responses, whose headers are sent before errors are known", () => {
    expect(isCdnCacheable({ ...ok, eagerGeneration: true })).toBe(false);
  });
});

describe("cdnCacheResponseMeta", () => {
  it("sets the Vercel CDN headers and the purge tag", () => {
    const meta = cdnCacheResponseMeta(ok);
    expect(meta.headers?.get("Vercel-CDN-Cache-Control")).toBe(
      CDN_CACHE_CONTROL,
    );
    expect(meta.headers?.get("Vercel-Cache-Tag")).toBe("wedgie-data,coffees");
    expect(meta.headers?.has("Cache-Control")).toBe(false);
  });

  it("returns no headers when not cacheable", () => {
    expect(cdnCacheResponseMeta({ ...ok, type: "mutation" })).toEqual({});
  });
});
