import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

// TRMNL runs src/transform.js as a bare script that defines `transform`, so load it the same way.
const transform = new Function(
  `${readFileSync(join(here, "../src/transform.js"), "utf8")}\nreturn transform;`,
)() as (input: Record<string, unknown>) => Record<string, unknown>;

// The three polling URLs in src/settings.yml, in order. TRMNL hands their responses to the
// transform as IDX_0..IDX_2. The fixtures are real responses from www.wedgietracker.com.
const ENDPOINTS = [
  "wedgie.getStats",
  "wedgie.getLatestWedgies",
  "wedgie.getTotalWedgies",
];

function fixtureInput() {
  return Object.fromEntries(
    ENDPOINTS.map((endpoint, i) => [
      `IDX_${i}`,
      JSON.parse(
        readFileSync(join(here, "fixtures", `${endpoint}.json`), "utf8"),
      ),
    ]),
  );
}

describe("transform", () => {
  it("produces every variable the markup reads, from the live API shapes", () => {
    const out = transform(fixtureInput());

    expect(out.total).toEqual(expect.any(Number));
    expect(out.pace).toEqual(expect.any(Number));
    expect(out.show_pace).toEqual(expect.any(Boolean));
    expect(out.all_time).toEqual(expect.any(Number));
    expect(out.record).toEqual(expect.any(Number));
    expect(out.record_label).toEqual(expect.any(String));
    expect(out.wave_svg).toMatch(/^<svg /);
    expect(out.days_since).toEqual(expect.any(Number));
    expect(out.live).toEqual(expect.any(Boolean));

    const latest = out.latest as Record<string, unknown>[];
    expect(latest).toHaveLength(3);
    for (const w of latest) {
      expect(w.number).toEqual(expect.any(Number));
      expect(w.date).toMatch(/^\d{2}\.\d{2}\.\d{2}$/);
      expect(w.player).toEqual(expect.any(String));
      expect(w.team).toEqual(expect.any(String));
      expect(w.against).toEqual(expect.any(String));
      expect(w.type).toEqual(expect.any(String));
    }
  });

  it("labels the record status against the previous record", () => {
    const input = fixtureInput();
    const stats = (
      input.IDX_0 as { result: { data: { json: Record<string, number> } } }
    ).result.data.json;

    stats.previousRecord = 74;
    stats.currentSeasonWedgies = 10;
    expect(transform(input).record_label).toBe("WE'RE AT");
    stats.currentSeasonWedgies = 74;
    expect(transform(input).record_label).toBe("ALL-TIME RECORD TIED");
    stats.currentSeasonWedgies = 75;
    expect(transform(input).record_label).toBe("NEW ALL-TIME RECORD");
  });

  it("leaves out an unknown opponent, as the website does", () => {
    const input = fixtureInput();
    const latest = (
      input.IDX_1 as { result: { data: { json: Record<string, string>[] } } }
    ).result.data.json;
    latest[0]!.teamAgainstName = "Unknown Away Team";

    const out = transform(input).latest as Record<string, string>[];
    expect(out[0]!.against).toBe("");
    expect(out[1]!.against).not.toBe("");
  });

  it("returns the input untouched when the stats call failed", () => {
    const input = { IDX_0: { error: "boom" } };
    expect(transform(input)).toBe(input);
  });
});
