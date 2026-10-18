import { describe, it, expect } from "vitest";
import {
  SHOUTOUT_PATTERN,
  normalizeShoutout,
  parseShoutouts,
  shoutoutNetwork,
  shoutoutProfileUrl,
} from "./shoutout";

describe("normalizeShoutout", () => {
  it("keeps X handles as they are", () => {
    expect(normalizeShoutout("@RipCT_Norb")).toBe("RipCT_Norb");
    expect(normalizeShoutout("https://x.com/PacersUK")).toBe("PacersUK");
  });

  it("reads Bluesky handles and profile URLs, in lower case", () => {
    expect(normalizeShoutout("@Guyforget.online")).toBe("guyforget.online");
    expect(normalizeShoutout("name.bsky.social")).toBe("name.bsky.social");
    expect(
      normalizeShoutout("https://bsky.app/profile/Adil-Hoxha.bsky.social"),
    ).toBe("adil-hoxha.bsky.social");
  });

  it("rejects what is neither", () => {
    expect(normalizeShoutout("")).toBeNull();
    expect(normalizeShoutout("has-dash")).toBeNull();
    expect(normalizeShoutout("bad..dots")).toBeNull();
    expect(normalizeShoutout("https://example.com/nodunks")).toBeNull();
  });
});

describe("parseShoutouts", () => {
  it("mixes X and Bluesky handles, dropping duplicates", () => {
    expect(
      parseShoutouts(
        "@PacersUK, guyforget.online @pacersuk bsky.app/profile/Guyforget.online",
      ),
    ).toEqual(["PacersUK", "guyforget.online"]);
  });
});

describe("shoutoutNetwork and shoutoutProfileUrl", () => {
  it("links X handles to x.com and Bluesky handles to bsky.app", () => {
    expect(shoutoutNetwork("PacersUK")).toBe("x");
    expect(shoutoutProfileUrl("PacersUK")).toBe("https://x.com/PacersUK");
    expect(shoutoutNetwork("guyforget.online")).toBe("bluesky");
    expect(shoutoutProfileUrl("guyforget.online")).toBe(
      "https://bsky.app/profile/guyforget.online",
    );
  });
});

describe("SHOUTOUT_PATTERN", () => {
  it("accepts both kinds and nothing else", () => {
    expect(SHOUTOUT_PATTERN.test("RipCT_Norb")).toBe(true);
    expect(SHOUTOUT_PATTERN.test("name.bsky.social")).toBe(true);
    expect(SHOUTOUT_PATTERN.test("Name.bsky.social")).toBe(false);
    expect(SHOUTOUT_PATTERN.test("waytoolonghandle123")).toBe(false);
  });
});
