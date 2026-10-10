import { MOMENT_FILTERS } from "./wedgieFilter";
import { resolveTeamQuery } from "./teamAliases";

/** "Three point" -> "three-point", "Karl-Anthony Towns" -> "karl-anthony-towns". */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "2025/26" <-> "2025-26" (slashes need escaping in a URL). */
export function seasonToParam(season: string): string {
  return season.replace("/", "-");
}

export function seasonFromParam(param: string): string {
  return /^\d{4}-\d{2}$/.test(param) ? param.replace("-", "/") : param;
}

export interface AllWedgiesState {
  /** Season name ("2025/26"), "" for every season, or undefined for the default. */
  season?: string;
  /** Wedgie number within the season, to open its modal. */
  wedgie?: number | null;
  /** The Team/Player filter as typed: a team code or alias, or a player name. */
  playerOrTeam?: string;
  /** Type name as stored ("Three point"). */
  type?: string;
  /** One of MOMENT_FILTERS, shown as the When filter. */
  moment?: string;
}

/** Builds the query string for /all-wedgies, leaving out anything unset. */
export function buildAllWedgiesQuery(state: AllWedgiesState): string {
  const params: [string, string][] = [];
  if (state.season !== undefined) {
    params.push(["season", state.season ? seasonToParam(state.season) : "all"]);
  }
  if (state.wedgie) params.push(["wedgie", String(state.wedgie)]);
  if (state.playerOrTeam) {
    const isTeam = resolveTeamQuery(state.playerOrTeam) !== null;
    params.push([isTeam ? "team" : "player", slugify(state.playerOrTeam)]);
  }
  if (state.type) params.push(["type", slugify(state.type)]);
  if (state.moment) params.push(["when", slugify(state.moment)]);
  return params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

/**
 * Reads /all-wedgies parameters, accepting both the readable ones and the
 * original short ones (ws, wn, wp, wt) that older shared links use.
 * Slugs are mapped back to their names using the lists passed in.
 */
export function parseAllWedgiesQuery(
  params: { get(name: string): string | null },
  lookup: { types?: string[]; players?: string[] } = {},
): AllWedgiesState {
  const state: AllWedgiesState = {};

  const season = params.get("season") ?? params.get("ws");
  if (season !== null)
    state.season = season === "all" ? "" : seasonFromParam(season);

  const wedgie = Number(params.get("wedgie") ?? params.get("wn"));
  if (Number.isInteger(wedgie) && wedgie > 0) state.wedgie = wedgie;

  const team = params.get("team") ?? params.get("wt");
  const player = params.get("player") ?? params.get("wp");
  if (team) {
    state.playerOrTeam = team.toUpperCase();
  } else if (player) {
    const match = lookup.players?.find((p) => slugify(p) === slugify(player));
    state.playerOrTeam = match ?? player.replace(/-/g, " ");
  }

  const type = params.get("type");
  if (type) {
    state.type =
      lookup.types?.find((t) => slugify(t) === slugify(type)) ?? type;
  }

  const moment = params.get("when");
  if (moment) {
    state.moment = MOMENT_FILTERS.find((m) => slugify(m) === slugify(moment));
  }

  return state;
}
