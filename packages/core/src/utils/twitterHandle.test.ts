import { describe, it, expect } from "vitest";
import { normalizeTwitterHandle, parseTwitterHandles } from "./twitterHandle";

describe("normalizeTwitterHandle", () => {
  it("strips a leading @", () => {
    expect(normalizeTwitterHandle("@nodunks")).toBe("nodunks");
  });

  it("accepts a bare handle", () => {
    expect(normalizeTwitterHandle("  wedgietracker ")).toBe("wedgietracker");
  });

  it("extracts the handle from x.com and twitter.com URLs", () => {
    expect(normalizeTwitterHandle("https://x.com/nodunks")).toBe("nodunks");
    expect(
      normalizeTwitterHandle("https://twitter.com/nodunks/status/123?s=20"),
    ).toBe("nodunks");
    expect(normalizeTwitterHandle("www.x.com/Some_User")).toBe("Some_User");
  });

  it("rejects invalid handles", () => {
    expect(normalizeTwitterHandle("")).toBeNull();
    expect(normalizeTwitterHandle("@")).toBeNull();
    expect(normalizeTwitterHandle("has-dash")).toBeNull();
    expect(normalizeTwitterHandle("waytoolonghandle123")).toBeNull();
    expect(normalizeTwitterHandle("https://example.com/nodunks")).toBeNull();
  });
});

describe("parseTwitterHandles", () => {
  it("splits on commas and whitespace, dropping invalid and duplicate entries", () => {
    expect(
      parseTwitterHandles("@nodunks, https://x.com/NoDunks  @fan_1 bad-one,"),
    ).toEqual(["nodunks", "fan_1"]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseTwitterHandles("   ")).toEqual([]);
  });
});
