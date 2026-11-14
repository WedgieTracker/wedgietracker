import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/services/stripe", () => ({ stripe: {} }));
vi.mock("next/cache", () => ({ cacheLife: () => undefined }));

const { seasonCoffeeStart } = await import("./coffees");

describe("seasonCoffeeStart", () => {
  it("starts a season's coffees on 1 July of its first year", () => {
    expect(seasonCoffeeStart("2026/27")?.toISOString()).toBe(
      "2026-07-01T00:00:00.000Z",
    );
  });

  it("has no start for a name without a year", () => {
    expect(seasonCoffeeStart("GEMS")).toBeNull();
  });
});
