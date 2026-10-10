import type { WedgieWithTypes } from "../types/wedgie";
import { gameMoment } from "./gameMoment";
import { resolveTeamQuery } from "./teamAliases";

export interface Filters {
  type: string;
  playerOrTeam: string;
  /** One of MOMENT_FILTERS, or "" for any. */
  moment?: string;
}

/** The game-moment choices offered by the filters, in display order. */
export const MOMENT_FILTERS = [
  "Clutch time",
  "Garbage time",
  "Overtime",
  "Final minute",
  "Q1",
  "Q2",
  "Q3",
  "Q4",
] as const;

/**
 * Whether a wedgie happened at the given moment. Q1-Q4 match the quarter
 * whatever its band; "Final minute" matches the last minute of Q1-Q3; the
 * others match their band. Wedgies without a game clock never match.
 */
export function matchesMoment(
  wedgie: WedgieWithTypes,
  moment: string,
): boolean {
  const band = gameMoment(wedgie);
  if (!band || !wedgie.period) return false;
  const quarter = /^Q([1-4])$/.exec(moment);
  if (quarter) return wedgie.period === Number(quarter[1]);
  if (moment === "Overtime") return wedgie.period >= 5;
  if (moment === "Final minute") return band.startsWith("Final minute");
  return band === moment;
}

export function matchesPlayerOrTeam(
  wedgie: WedgieWithTypes,
  query: string,
): boolean {
  const resolvedCodes = resolveTeamQuery(query);
  if (resolvedCodes) {
    return resolvedCodes.some(
      (code) => wedgie.teamName === code || wedgie.teamAgainstName === code,
    );
  }
  const q = query.toLowerCase();
  return (
    (wedgie.playerName?.toLowerCase().includes(q) ?? false) ||
    (wedgie.teamName?.toLowerCase().includes(q) ?? false) ||
    (wedgie.teamAgainstName?.toLowerCase().includes(q) ?? false)
  );
}

export function matchesFilter(
  wedgie: WedgieWithTypes,
  filters: Filters,
): boolean {
  const matchesType =
    !filters.type ||
    (wedgie.types?.some(
      (t: { name: string }) =>
        t.name.toLowerCase() === filters.type.toLowerCase(),
    ) ??
      false);

  const matchesTeamOrPlayer =
    !filters.playerOrTeam || matchesPlayerOrTeam(wedgie, filters.playerOrTeam);

  const matchesWhen = !filters.moment || matchesMoment(wedgie, filters.moment);

  return matchesType && matchesTeamOrPlayer && matchesWhen;
}
