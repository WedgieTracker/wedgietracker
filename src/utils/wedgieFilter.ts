import type { WedgieWithTypes } from "~/types/wedgie";
import { resolveTeamQuery } from "./teamAliases";

export interface Filters {
  type: string;
  playerOrTeam: string;
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

  return matchesType && matchesTeamOrPlayer;
}
