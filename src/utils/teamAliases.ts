/**
 * Structured NBA team records.
 * The lookup map is derived from these at module load — never hand-roll the flat map.
 * When a relocated franchise shares a nickname with the legacy team (e.g. Brooklyn Nets
 * vs. New Jersey Nets), disambiguate the legacy team's `nickname` field with the city
 * prefix (e.g. "NJ Nets") so the bare nickname routes to the current franchise.
 */

export interface TeamRecord {
  code: string;
  city: string;
  nickname: string;
  fullName: string;
  aliases?: string[];
}

/**
 * Explicitly ambiguous keys that map to more than one team.
 * These are seeded into the lookup first; subsequent per-team processing
 * skips any key already present here.
 */
const MULTI_TEAM_ALIASES: Record<string, string[]> = {
  la: ["LAL", "LAC"],
  "los angeles": ["LAL", "LAC"],
};

export const TEAMS: TeamRecord[] = [
  {
    code: "ATL",
    city: "Atlanta",
    nickname: "Hawks",
    fullName: "Atlanta Hawks",
  },
  {
    code: "BKN",
    city: "Brooklyn",
    nickname: "Nets",
    fullName: "Brooklyn Nets",
  },
  {
    code: "BOS",
    city: "Boston",
    nickname: "Celtics",
    fullName: "Boston Celtics",
  },
  {
    code: "CHA",
    city: "Charlotte",
    nickname: "Hornets",
    fullName: "Charlotte Hornets",
  },
  {
    code: "CHI",
    city: "Chicago",
    nickname: "Bulls",
    fullName: "Chicago Bulls",
  },
  {
    code: "CLE",
    city: "Cleveland",
    nickname: "Cavaliers",
    fullName: "Cleveland Cavaliers",
    aliases: ["cavs"],
  },
  {
    code: "DET",
    city: "Detroit",
    nickname: "Pistons",
    fullName: "Detroit Pistons",
  },
  {
    code: "IND",
    city: "Indiana",
    nickname: "Pacers",
    fullName: "Indiana Pacers",
  },
  { code: "MIA", city: "Miami", nickname: "Heat", fullName: "Miami Heat" },
  {
    code: "MIL",
    city: "Milwaukee",
    nickname: "Bucks",
    fullName: "Milwaukee Bucks",
  },
  {
    code: "NYK",
    city: "New York",
    nickname: "Knicks",
    fullName: "New York Knicks",
    aliases: ["knickerbockers"],
  },
  {
    code: "ORL",
    city: "Orlando",
    nickname: "Magic",
    fullName: "Orlando Magic",
  },
  {
    code: "PHI",
    city: "Philadelphia",
    nickname: "76ers",
    fullName: "Philadelphia 76ers",
    aliases: ["sixers", "philly"],
  },
  {
    code: "TOR",
    city: "Toronto",
    nickname: "Raptors",
    fullName: "Toronto Raptors",
    aliases: ["raps"],
  },
  {
    code: "WAS",
    city: "Washington",
    nickname: "Wizards",
    fullName: "Washington Wizards",
  },

  {
    code: "DAL",
    city: "Dallas",
    nickname: "Mavericks",
    fullName: "Dallas Mavericks",
    aliases: ["mavs"],
  },
  {
    code: "DEN",
    city: "Denver",
    nickname: "Nuggets",
    fullName: "Denver Nuggets",
  },
  {
    code: "GSW",
    city: "Golden State",
    nickname: "Warriors",
    fullName: "Golden State Warriors",
    aliases: ["dubs"],
  },
  {
    code: "HOU",
    city: "Houston",
    nickname: "Rockets",
    fullName: "Houston Rockets",
  },
  {
    code: "LAC",
    city: "Los Angeles",
    nickname: "Clippers",
    fullName: "Los Angeles Clippers",
    aliases: ["la clippers", "clips"],
  },
  {
    code: "LAL",
    city: "Los Angeles",
    nickname: "Lakers",
    fullName: "Los Angeles Lakers",
    aliases: ["la lakers"],
  },
  {
    code: "MEM",
    city: "Memphis",
    nickname: "Grizzlies",
    fullName: "Memphis Grizzlies",
    aliases: ["grizz"],
  },
  {
    code: "MIN",
    city: "Minnesota",
    nickname: "Timberwolves",
    fullName: "Minnesota Timberwolves",
    aliases: ["wolves"],
  },
  {
    code: "NOP",
    city: "New Orleans",
    nickname: "Pelicans",
    fullName: "New Orleans Pelicans",
    aliases: ["pels"],
  },
  {
    code: "OKC",
    city: "Oklahoma City",
    nickname: "Thunder",
    fullName: "Oklahoma City Thunder",
  },
  { code: "PHX", city: "Phoenix", nickname: "Suns", fullName: "Phoenix Suns" },
  {
    code: "POR",
    city: "Portland",
    nickname: "Trail Blazers",
    fullName: "Portland Trail Blazers",
    aliases: ["blazers"],
  },
  {
    code: "SAC",
    city: "Sacramento",
    nickname: "Kings",
    fullName: "Sacramento Kings",
  },
  {
    code: "SAS",
    city: "San Antonio",
    nickname: "Spurs",
    fullName: "San Antonio Spurs",
  },
  { code: "UTA", city: "Utah", nickname: "Jazz", fullName: "Utah Jazz" },

  {
    code: "NJ",
    city: "New Jersey",
    nickname: "NJ Nets",
    fullName: "New Jersey Nets",
  },
  {
    code: "SEA",
    city: "Seattle",
    nickname: "SuperSonics",
    fullName: "Seattle SuperSonics",
    aliases: ["sonics"],
  },
];

function buildLookup(
  teams: TeamRecord[],
  multiAliases: Record<string, string[]>,
): Map<string, string[]> {
  const map = new Map<string, string[]>(Object.entries(multiAliases));

  for (const team of teams) {
    const keys = new Set([
      team.code.toLowerCase(),
      team.city.toLowerCase(),
      team.nickname.toLowerCase(),
      team.fullName.toLowerCase(),
      ...(team.aliases ?? []).map((a) => a.toLowerCase()),
    ]);

    for (const key of keys) {
      const existing = map.get(key);
      if (existing !== undefined) {
        if (existing.includes(team.code)) continue;
        throw new Error(
          `[teamAliases] Collision on key "${key}": already mapped to ${JSON.stringify(existing)}, cannot also map to "${team.code}". ` +
            `Add it to MULTI_TEAM_ALIASES if intentional.`,
        );
      }
      map.set(key, [team.code]);
    }
  }

  return map;
}

const LOOKUP = buildLookup(TEAMS, MULTI_TEAM_ALIASES);

/**
 * Resolves a free-text query to a list of team codes.
 *
 * - Exact match (case-insensitive) on code, city, nickname, fullName, or alias → [code]
 * - Ambiguous location (e.g. "LA") → ["LAL", "LAC"]
 * - Unknown / whitespace-only → null (caller should fall back to substring search)
 */
export function resolveTeamQuery(query: string): string[] | null {
  const normalised = query.trim().toLowerCase();
  if (!normalised) return null;
  return LOOKUP.get(normalised) ?? null;
}
