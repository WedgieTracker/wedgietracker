/**
 * Games, read from their own columns.
 *
 * A game row has `home_team`, `away_team`, `game_date` (the US Eastern
 * calendar day, YYYY-MM-DD) and `tip_at` (the real tip-off as an ISO UTC
 * instant, null when unknown). Its `name` is the older text key,
 * "HOME @ AWAY - <date and time>", home team first: the reverse of NBA
 * notation, where "@" means away @ home. Nothing should show `name` or parse it
 * outside this file; every label is built here from the columns. The time in a
 * name is never read as a time: a game's tip-off is `tip_at` or unknown.
 */

/** Teams of the All-Star Game, whose wedgies don't name a real opponent. */
export const ALL_STAR_TEAMS = ["STARS", "EST", "WST"] as const;

export function isAllStarTeam(team: string | null | undefined) {
  return !!team && (ALL_STAR_TEAMS as readonly string[]).includes(team);
}

export interface GameTeams {
  homeTeam: string;
  awayTeam: string;
}

export interface GameColumns extends GameTeams {
  gameDate: string;
}

/** The shape a game row has; the columns can be null on a row not yet backfilled. */
export interface GameLike {
  name?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  gameDate?: string | null;
  /** The real tip-off, an ISO UTC instant; null when unknown. */
  tipAt?: string | null;
}

const NAME = /^(.+?) @ (.+?) - (\d{4}-\d{2}-\d{2})(?:T.*)?$/;

/**
 * The teams and day a game name stands for, the same way migration 0002
 * backfilled them: "HOU @ NOP - 2018-03-24T00:00:00.000Z" is Houston at home
 * to New Orleans on 24 March 2018. Whatever follows the day is ignored: the
 * tip-off is `tip_at`, never the name.
 */
export function parseGameName(
  name: string | null | undefined,
): GameColumns | null {
  const m = name ? NAME.exec(name) : null;
  if (!m) return null;
  return { homeTeam: m[1]!, awayTeam: m[2]!, gameDate: m[3]! };
}

/** The US Eastern calendar day of an instant, YYYY-MM-DD. */
export function easternDay(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

/**
 * The game's tip-off as US Eastern wall-clock time, "19:30", from `tipAt`;
 * null when the tip-off isn't known, whatever the name says.
 */
export function gameTipEastern(game: GameLike): string | null {
  if (!game.tipAt) return null;
  const at = new Date(game.tipAt);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleTimeString("en-GB", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** The game's teams and day, from its columns (or its name on a row not yet backfilled). */
export function gameColumns(game: GameLike): GameColumns | null {
  if (game.homeTeam && game.awayTeam && game.gameDate) {
    return {
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      gameDate: game.gameDate,
    };
  }
  return parseGameName(game.name);
}

/** NBA notation, away team first: "POR @ HOU". */
export function gameLabel(game: GameLike): string {
  const c = gameColumns(game);
  return c ? `${c.awayTeam} @ ${c.homeTeam}` : (game.name ?? "");
}

/** The NBA label with the game's day: "POR @ HOU, 2018-03-24". */
export function gameLabelWithDate(game: GameLike): string {
  const c = gameColumns(game);
  return c ? `${gameLabel(c)}, ${c.gameDate}` : (game.name ?? "");
}

/**
 * The plain-English version, "HOU v POR, at HOU". With `team` (the wedgie's
 * own team) that team comes first, so it reads from its side; otherwise the
 * home team does.
 */
export function gameMatchup(game: GameLike, team?: string | null): string {
  const c = gameColumns(game);
  if (!c) return game.name ?? "";
  const first = team === c.awayTeam ? c.awayTeam : c.homeTeam;
  const other = first === c.homeTeam ? c.awayTeam : c.homeTeam;
  return `${first} v ${other}, at ${c.homeTeam}`;
}

/**
 * Why a wedgie's teams can't be on this game, or null when they can: its team
 * and opponent must be the game's home and away teams, in either order.
 * All-Star games (STARS, EST, WST) and GEMS (no game) are left alone.
 */
export function gameTeamsProblem(
  wedgie: {
    teamName: string;
    teamAgainstName: string;
    seasonName?: string | null;
  },
  game: GameLike,
): string | null {
  if (wedgie.seasonName === "GEMS") return null;
  const c = gameColumns(game);
  if (!c) return `The game ${game.name ?? ""} has no teams`;
  if (
    [wedgie.teamName, wedgie.teamAgainstName, c.homeTeam, c.awayTeam].some(
      isAllStarTeam,
    )
  ) {
    return null;
  }
  const { teamName: team, teamAgainstName: against } = wedgie;
  const matches =
    (team === c.homeTeam && against === c.awayTeam) ||
    (team === c.awayTeam && against === c.homeTeam);
  if (matches) return null;
  return `${team} v ${against} is not the game ${gameLabel(c)} on ${c.gameDate} (${c.awayTeam} at ${c.homeTeam})`;
}

/**
 * Whether a stored wedgie date falls on the game's day. Wedgie dates come in
 * three forms: noon UTC on the Eastern day (older seasons), the tip-off in
 * Eastern time written as UTC, and a real UTC time; the first two keep the
 * Eastern day as their UTC day, the last has it in Eastern time, so either day
 * counts.
 */
export function wedgieDateOnGameDay(
  wedgieDate: string,
  gameDate: string,
): boolean {
  const d = new Date(wedgieDate);
  if (Number.isNaN(d.getTime())) return false;
  return wedgieDate.slice(0, 10) === gameDate || easternDay(d) === gameDate;
}

/**
 * The date a wedgie on this game gets when none is given: the game's
 * `createdAt` (its tip-off) when that is on the game's day, else noon UTC on
 * the game's day, as older seasons are stored.
 */
export function wedgieDateForGame(game: GameLike & { createdAt?: string }) {
  const c = gameColumns(game);
  if (game.createdAt) {
    const created = new Date(game.createdAt);
    if (
      !Number.isNaN(created.getTime()) &&
      (!c || game.createdAt.slice(0, 10) === c.gameDate)
    ) {
      return created.toISOString();
    }
  }
  return c ? `${c.gameDate}T12:00:00.000Z` : null;
}

/**
 * Why a wedgie can't be saved on this game, or null when it can: its team and
 * opponent must be the game's two teams (see gameTeamsProblem) and its date, when
 * it has one, must fall on the game's day (see wedgieDateOnGameDay).
 */
export function wedgieGameProblem(
  wedgie: {
    teamName: string;
    teamAgainstName: string;
    seasonName?: string | null;
    wedgieDate?: string | null;
  },
  game: GameLike,
): string | null {
  const teams = gameTeamsProblem(wedgie, game);
  if (teams) return teams;
  const c = gameColumns(game);
  if (
    wedgie.seasonName !== "GEMS" &&
    c &&
    wedgie.wedgieDate &&
    !wedgieDateOnGameDay(wedgie.wedgieDate, c.gameDate)
  ) {
    return `The date ${wedgie.wedgieDate} is not the day of ${gameLabel(c)} (${c.gameDate}, US Eastern)`;
  }
  return null;
}
