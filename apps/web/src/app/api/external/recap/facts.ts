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

const MILESTONES = new Set([5, 10, 15, 20, 25, 30]);

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

/**
 * @param history every wedgie on the site, GEMS left out
 * @param openingNights the first game date of each season, by season name
 */
export function wedgieFacts(
  w: PastWedgie,
  history: PastWedgie[],
  openingNights: Record<string, string>,
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
  const previous = mine
    .filter((h) => before(h, w))
    .sort((a, b) => (before(a, b) ? 1 : -1))[0];
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
