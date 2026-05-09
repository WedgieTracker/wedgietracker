import { describe, it, expect } from "vitest";
import { resolveTeamQuery } from "./teamAliases";

describe("resolveTeamQuery", () => {
  it('maps "bucks" to ["MIL"]', () => {
    const result = resolveTeamQuery("bucks");
    expect(result).toEqual(["MIL"]);
  });

  it("handles case insensitivity (e.g., 'Milwaukee' → ['MIL'])", () => {
    const result = resolveTeamQuery("Milwaukee");
    expect(result).toEqual(["MIL"]);
  });

  it("handles multi-word aliases (e.g., 'milwaukee bucks')", () => {
    const result = resolveTeamQuery("milwaukee bucks");
    expect(result).toEqual(["MIL"]);
  });

  it("returns multiple teams for ambiguous locations (e.g., 'LA' → ['LAL', 'LAC'])", () => {
    const result = resolveTeamQuery("LA");
    expect(result).toEqual(["LAL", "LAC"]);
  });

  it("returns multiple teams for 'los angeles'", () => {
    const result = resolveTeamQuery("los angeles");
    expect(result).toEqual(["LAL", "LAC"]);
  });

  it("resolves legacy/historic teams (e.g., 'sonics' → ['SEA'])", () => {
    const result = resolveTeamQuery("sonics");
    expect(result).toEqual(["SEA"]);
  });

  it("returns null for unknown terms (e.g., 'hawkins')", () => {
    const result = resolveTeamQuery("hawkins");
    expect(result).toBeNull();
  });

  it("returns null for an empty string", () => {
    const result = resolveTeamQuery("");
    expect(result).toBeNull();
  });

  it("handles strings with leading/trailing whitespace", () => {
    const result = resolveTeamQuery("  bulls  ");
    expect(result).toEqual(["CHI"]);
  });
});
