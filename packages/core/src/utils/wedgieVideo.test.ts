import { describe, expect, it } from "vitest";
import { getVideoSrc, startSeconds } from "./wedgieVideo";

describe("startSeconds", () => {
  it.each([
    ["https://youtu.be/abcdefghijk?t=754", 754],
    ["https://youtu.be/abcdefghijk?t=754s", 754],
    ["https://youtu.be/sXRjlwGcdBM?t=20m53s", 1253],
    ["https://www.youtube.com/watch?v=abcdefghijk&t=1h2m3s", 3723],
    ["https://youtu.be/abcdefghijk#t=90", 90],
    ["https://youtu.be/abcdefghijk?start=12&si=foo", 12],
    ["https://youtu.be/abcdefghijk", 0],
  ])("%s starts at %i", (url, seconds) => {
    expect(startSeconds(url)).toBe(seconds);
  });
});

describe("getVideoSrc", () => {
  it("starts a minutes-and-seconds No Dunks link at the right moment", () => {
    expect(
      getVideoSrc("youtubeNoDunks", {
        youtubeNoDunks: "https://youtu.be/sXRjlwGcdBM?t=20m53s",
      }),
    ).toBe("https://www.youtube.com/embed/sXRjlwGcdBM?start=1253");
  });
});
