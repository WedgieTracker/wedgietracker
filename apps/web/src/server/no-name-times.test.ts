// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseGameName } from "@wedgietracker/core/utils/game";

// A game's tip-off is tip_at. The time in a game's name ("HOU @ NOP -
// 2018-03-24T19:30:00Z", Eastern wall-clock written as UTC) is never read as one.

const roots = [
  path.join(__dirname, ".."),
  path.join(__dirname, "../../../../packages/core/src"),
];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sources(full);
    return /\.(ts|tsx|mjs)$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [full]
      : [];
  });
}

const timeFromName = [
  // a tip read off a parsed name
  /parseGameName\([^)]*\)\??\.tip\b/,
  /\btipOf\(/,
  // slicing or splitting the time out of a name
  /\bname\??\.(slice|substring|substr)\(\s*1[0-9]/,
  /\bname\??\.split\(\s*["'](T| - )["']\s*\)/,
  /\bname\??\.(match|replace)\([^)]*T\\d/,
];

describe("game names", () => {
  it("parseGameName gives the teams and day only, never a time", () => {
    expect(
      Object.keys(parseGameName("NYK @ SAS - 2026-11-08T20:30:00Z") ?? {}),
    ).toEqual(["homeTeam", "awayTeam", "gameDate"]);
  });

  it("no source file reads a time out of a game name", () => {
    const offenders = roots.flatMap(sources).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          timeFromName.some((re) => re.test(line))
            ? [`${path.relative(process.cwd(), file)}:${i + 1}: ${line.trim()}`]
            : [],
        ),
    );
    expect(offenders).toEqual([]);
  });
});
