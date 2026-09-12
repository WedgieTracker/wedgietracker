import { describe, it, expect } from "vitest";
import { resolveTeamQuery } from "./teamAliases";

describe("resolveTeamQuery", () => {
  it('maps "bucks" to ["MIL"]', () => {
    expect(resolveTeamQuery("bucks")).toEqual(["MIL"]);
  });

  it("handles case insensitivity (e.g., 'Milwaukee' → ['MIL'])", () => {
    expect(resolveTeamQuery("Milwaukee")).toEqual(["MIL"]);
  });

  it("handles multi-word aliases (e.g., 'milwaukee bucks')", () => {
    expect(resolveTeamQuery("milwaukee bucks")).toEqual(["MIL"]);
  });

  it("returns multiple teams for ambiguous locations (e.g., 'LA' → ['LAL', 'LAC'])", () => {
    expect(resolveTeamQuery("LA")).toEqual(["LAL", "LAC"]);
  });

  it("returns multiple teams for 'los angeles'", () => {
    expect(resolveTeamQuery("los angeles")).toEqual(["LAL", "LAC"]);
  });

  it("resolves legacy/historic teams (e.g., 'sonics' → ['SEA'])", () => {
    expect(resolveTeamQuery("sonics")).toEqual(["SEA"]);
  });

  it("returns null for unknown terms (e.g., 'hawkins')", () => {
    expect(resolveTeamQuery("hawkins")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(resolveTeamQuery("")).toBeNull();
  });

  it("handles strings with leading/trailing whitespace", () => {
    expect(resolveTeamQuery(" bulls ")).toEqual(["CHI"]);
  });

  it("resolves 3-letter codes directly (e.g., 'MIL' → ['MIL'])", () => {
    expect(resolveTeamQuery("MIL")).toEqual(["MIL"]);
  });

  it("resolves 3-letter codes for other teams (BOS, LAL)", () => {
    expect(resolveTeamQuery("BOS")).toEqual(["BOS"]);
    expect(resolveTeamQuery("LAL")).toEqual(["LAL"]);
  });

  it("'Nets' defaults to current franchise → ['BKN']", () => {
    expect(resolveTeamQuery("Nets")).toEqual(["BKN"]);
  });

  it("'NJ Nets' resolves to legacy team → ['NJ']", () => {
    expect(resolveTeamQuery("NJ Nets")).toEqual(["NJ"]);
  });

  it("whitespace-only string → null", () => {
    expect(resolveTeamQuery("   ")).toBeNull();
  });

  it("partial code that is not an alias (e.g. 'MI') → null", () => {
    expect(resolveTeamQuery("MI")).toBeNull();
  });

  it("'LA Lakers' resolves to LAL only (not the multi-team LA)", () => {
    expect(resolveTeamQuery("LA Lakers")).toEqual(["LAL"]);
  });

  it("'LA Clippers' resolves to LAC only (not the multi-team LA)", () => {
    expect(resolveTeamQuery("LA Clippers")).toEqual(["LAC"]);
  });

  it("nickname aliases resolve to the right code (Sixers, Wolves, Cavs)", () => {
    expect(resolveTeamQuery("Sixers")).toEqual(["PHI"]);
    expect(resolveTeamQuery("Wolves")).toEqual(["MIN"]);
    expect(resolveTeamQuery("Cavs")).toEqual(["CLE"]);
  });

  it("legacy team cities resolve directly (e.g., 'Seattle' → ['SEA'])", () => {
    expect(resolveTeamQuery("Seattle")).toEqual(["SEA"]);
    expect(resolveTeamQuery("New Jersey")).toEqual(["NJ"]);
  });
});
