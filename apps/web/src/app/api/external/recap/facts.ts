import { SEASON_GAMES } from "@wedgietracker/core/utils/paceCalculator";

// Facts worth telling about a night's wedgies, worked out from the whole history so the recap's
// writer never has to guess. `notable` marks the ones (firsts, milestones, long gaps) the admin
// confirms before they go in the email.

export interface Fact {
  text: string;
  notable: boolean;
}

export interface PastWedgie {
  seasonName: string;
  number: number;
  playerName: string;
  teamName: string;
  /** The game date, YYYY-MM-DD in US Eastern time. */
  date: string;
}

/** How many games were played on one night of one season. */
export interface GameNight {
  seasonName: string;
  /** YYYY-MM-DD in US Eastern time, like PastWedgie.date. */
  date: string;
  games: number;
}

const MILESTONES = new Set([5, 10, 15, 20, 25, 30]);
/** A league-wide wait at least this long (within a season) is worth calling out. */
const LONG_WAIT_DAYS = 7;
/** Below this many games a pace comparison says nothing; below the second it isn't news. */
const PACE_FACT_GAMES = 50;
const PACE_NOTABLE_GAMES = 100;
/** Ahead or behind the average only counts as news by this share or more. */
const PACE_CLEAR_GAP = 0.2;

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"}`;
}

const seasonStart = (name: string) => Number(name.slice(0, 4));
const sameWedgie = (a: PastWedgie, b: PastWedgie) =>
  a.seasonName === b.seasonName && a.number === b.number;
const before = (a: PastWedgie, b: PastWedgie) =>
  a.date < b.date ||
  (a.date === b.date &&
    (a.seasonName < b.seasonName ||
      (a.seasonName === b.seasonName && a.number < b.number)));

/** The player's most recent wedgie before this one, or undefined for a first career wedgie. */
export function previousWedgie(
  w: PastWedgie,
  history: PastWedgie[],
): PastWedgie | undefined {
  return history
    .filter((h) => h.playerName === w.playerName && before(h, w))
    .sort((a, b) => (before(a, b) ? 1 : -1))[0];
}

/**
 * Time since anyone's previous wedgie: days between the two nights, and the
 * games played on the nights in between. Null when there is no earlier one.
 */
export function leagueGap(
  w: PastWedgie,
  history: PastWedgie[],
  nights: GameNight[],
): { days: number; games: number; sameSeason: boolean } | null {
  const previous = history
    .filter((h) => before(h, w))
    .sort((a, b) => (before(a, b) ? 1 : -1))[0];
  if (!previous) return null;
  const days = Math.round(
    (Date.parse(w.date) - Date.parse(previous.date)) / 86_400_000,
  );
  const games = nights
    .filter((n) => n.date > previous.date && n.date < w.date)
    .reduce((acc, n) => acc + n.games, 0);
  return { days, games, sameSeason: previous.seasonName === w.seasonName };
}

/** Whether the player has earlier wedgies, but none for this team. */
export function firstForTeam(w: PastWedgie, history: PastWedgie[]): boolean {
  const earlier = history.filter(
    (h) => h.playerName === w.playerName && before(h, w),
  );
  return earlier.length > 0 && !earlier.some((h) => h.teamName === w.teamName);
}

/**
 * @param history every wedgie on the site, GEMS left out
 * @param openingNights the first game date of each season, by season name
 */
export function wedgieFacts(
  w: PastWedgie,
  history: PastWedgie[],
  openingNights: Record<string, string>,
  nights: GameNight[] = [],
): Fact[] {
  const facts: Fact[] = [];
  const firstTracked = Object.keys(openingNights).sort()[0];

  if (w.number === 1) {
    facts.push({
      text: `First wedgie of the ${w.seasonName} season`,
      notable: true,
    });
  }

  if (openingNights[w.seasonName] === w.date) {
    const earlier = new Set(
      history
        .filter(
          (h) =>
            h.seasonName < w.seasonName &&
            openingNights[h.seasonName] === h.date,
        )
        .map((h) => h.seasonName),
    ).size;
    facts.push({
      text:
        earlier === 0
          ? `First opening-night wedgie since we started tracking in ${firstTracked}`
          : `Opening-night wedgie, the ${ordinal(earlier + 1)} since ${firstTracked}`,
      notable: true,
    });
  }

  const mine = history.filter((h) => h.playerName === w.playerName);
  const career = mine.filter((h) => before(h, w) || sameWedgie(h, w)).length;
  const previous = previousWedgie(w, history);
  if (career === 1) {
    facts.push({
      text: `${w.playerName}'s first career wedgie`,
      notable: true,
    });
  } else {
    const gap = previous
      ? seasonStart(w.seasonName) - seasonStart(previous.seasonName)
      : 0;
    facts.push({
      text:
        gap >= 2 && previous
          ? `${w.playerName}'s ${ordinal(career)} career wedgie and first since ${previous.seasonName}`
          : `${w.playerName}'s ${ordinal(career)} career wedgie`,
      notable: gap >= 2 || MILESTONES.has(career),
    });
  }

  if (firstForTeam(w, history)) {
    facts.push({
      text: `${w.playerName}'s first wedgie for ${w.teamName}`,
      notable: true,
    });
  }

  const gap = leagueGap(w, history, nights);
  if (gap?.sameSeason && gap.days >= LONG_WAIT_DAYS) {
    facts.push({
      text: `First wedgie in ${gap.days} days, after ${gap.games} games without one`,
      notable: true,
    });
  }

  const teamSeason = history.filter(
    (h) =>
      h.teamName === w.teamName &&
      h.seasonName === w.seasonName &&
      (before(h, w) || sameWedgie(h, w)),
  ).length;
  facts.push({
    text: `${w.teamName}'s ${ordinal(teamSeason)} wedgie of the season`,
    notable: false,
  });

  return facts;
}

/** Facts about the night as a whole, such as more than one wedgie. */
export function nightFacts(
  date: string,
  count: number,
  history: PastWedgie[],
): Fact[] {
  if (count < 2) return [];
  const perNight = new Map<string, number>();
  for (const h of history) {
    if (h.date !== date) perNight.set(h.date, (perNight.get(h.date) ?? 0) + 1);
  }
  const best = Math.max(0, ...perNight.values());
  return [
    {
      text:
        count > best
          ? `${count} wedgies in one night, the most we have ever tracked`
          : `${count} wedgies in one night`,
      notable: true,
    },
  ];
}

export interface SeasonPace {
  season: string;
  /** Wedgies and games in this season up to and including the night. */
  wedgies: number;
  games: number;
  /**
   * The average of the completed seasons, as Stats for Nerds and the pace use
   * it: each season's wedgies per game it played, averaged.
   */
  average: {
    seasons: number;
    /** What the average rate gives after this many games. */
    wedgiesAtSameGames: number;
    /** A normal season: the average rate over a full schedule. */
    perSeason: number;
  } | null;
  lastSeason: {
    name: string;
    wedgies: number;
    games: number;
    /** Last season's wedgies by the time it had played as many games. */
    wedgiesAtSameGames: number;
  } | null;
}

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Where a season stood after a night, next to the average of the completed
 * seasons at the same number of games (and to last season, as a field).
 *
 * @param seasonGames games each season played (season.totalGames)
 */
export function seasonPace(
  date: string,
  season: string,
  history: PastWedgie[],
  nights: GameNight[],
  seasonGames: Record<string, number>,
): { pace: SeasonPace; fact: Fact | null } {
  const games = nights
    .filter((n) => n.seasonName === season && n.date <= date)
    .reduce((acc, n) => acc + n.games, 0);
  const wedgies = history.filter(
    (h) => h.seasonName === season && h.date <= date,
  ).length;

  // completed seasons, as in server/pace.ts: every earlier one with games
  const rates = Object.entries(seasonGames)
    .filter(([name, total]) => name < season && total > 0)
    .map(
      ([name, total]) =>
        history.filter((h) => h.seasonName === name).length / total,
    );
  const rate = rates.length
    ? rates.reduce((acc, r) => acc + r, 0) / rates.length
    : null;
  const expected = rate === null ? null : Math.round(rate * games);
  const average =
    rate === null || expected === null
      ? null
      : {
          seasons: rates.length,
          wedgiesAtSameGames: expected,
          perSeason: Math.round(rate * SEASON_GAMES),
        };

  const pace: SeasonPace = {
    season,
    wedgies,
    games,
    average,
    lastSeason: lastSeasonAtSameGames(season, games, history, nights),
  };
  if (!average || expected === null || games < PACE_FACT_GAMES) {
    return { pace, fact: null };
  }
  const where =
    wedgies > expected
      ? "Ahead of"
      : wedgies < expected
        ? "Behind"
        : "Level with";
  // a clear gap only, so a season tracking the average is not news every night
  const clear =
    expected > 0
      ? Math.abs(wedgies - expected) / expected >= PACE_CLEAR_GAP
      : wedgies > 0;
  return {
    pace,
    fact: {
      text: `${where} the ${average.seasons}-season average: ${fmt(wedgies)} after ${fmt(games)} games, against ${fmt(expected)} expected`,
      notable: games >= PACE_NOTABLE_GAMES && wedgies !== expected && clear,
    },
  };
}

function lastSeasonAtSameGames(
  season: string,
  games: number,
  history: PastWedgie[],
  nights: GameNight[],
): SeasonPace["lastSeason"] {
  const lastName = [...new Set(nights.map((n) => n.seasonName))]
    .filter((name) => name < season)
    .sort()
    .pop();
  if (!lastName) return null;
  const lastNights = nights
    .filter((n) => n.seasonName === lastName)
    .sort((a, b) => a.date.localeCompare(b.date));
  const lastWedgies = history.filter((h) => h.seasonName === lastName);
  // the night last season reached this many games
  let played = 0;
  let cutoff = lastNights.at(-1)?.date ?? "";
  for (const n of lastNights) {
    played += n.games;
    if (played >= games) {
      cutoff = n.date;
      break;
    }
  }
  return {
    name: lastName,
    wedgies: lastWedgies.length,
    games: lastNights.reduce((acc, n) => acc + n.games, 0),
    wedgiesAtSameGames: lastWedgies.filter((h) => h.date <= cutoff).length,
  };
}
