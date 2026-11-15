import { cacheLife, cacheTag } from "next/cache";
import { asc, eq, ne } from "drizzle-orm";
import {
  game,
  type as typeTable,
  wedgie,
  wedgieToType,
} from "@wedgietracker/core/schema";
import { gameLabel } from "@wedgietracker/core/utils/game";
import { db } from "~/server/db";
import { CACHE_TAGS } from "~/server/cache";

/**
 * All-time stats for /stats-for-nerds, across every season (GEMS left out):
 * where on the court, shot types, which quarter, records and career leaders.
 */
export async function getNerdExtras() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const [wedgies, typeRows, games] = await Promise.all([
    db
      .select({
        id: wedgie.id,
        playerName: wedgie.playerName,
        gameId: wedgie.gameId,
        wedgieDate: wedgie.wedgieDate,
        period: wedgie.period,
        position: wedgie.position,
      })
      .from(wedgie)
      .where(ne(wedgie.seasonName, "GEMS")),
    db
      .select({ wedgieId: wedgieToType.wedgieId, name: typeTable.name })
      .from(wedgieToType)
      .innerJoin(typeTable, eq(typeTable.id, wedgieToType.typeId))
      .innerJoin(wedgie, eq(wedgie.id, wedgieToType.wedgieId))
      .where(ne(wedgie.seasonName, "GEMS")),
    db
      .select({
        id: game.id,
        name: game.name,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameDate: game.gameDate,
        createdAt: game.createdAt,
      })
      .from(game)
      .orderBy(asc(game.createdAt), asc(game.name)),
  ]);

  const positions = wedgies.flatMap((w) => {
    const p = w.position as { x?: unknown; y?: unknown } | null;
    const x = Number(p?.x);
    const y = Number(p?.y);
    return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
  });

  const typeCounts = new Map<string, number>();
  for (const t of typeRows)
    typeCounts.set(t.name, (typeCounts.get(t.name) ?? 0) + 1);
  const types = [...typeCounts]
    .map(([name, n]) => ({ name, count: n }))
    .sort((a, b) => b.count - a.count);

  const quarterCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, OT: 0 };
  for (const w of wedgies) {
    if (!w.period) continue;
    const label = w.period > 4 ? "OT" : (`Q${w.period}` as const);
    quarterCounts[label as keyof typeof quarterCounts]++;
  }
  const knownMoments = Object.values(quarterCounts).reduce((a, b) => a + b, 0);

  // Records: per game, per night, and the longest run of games without one.
  const gamesById = new Map(games.map((g) => [g.id, g]));
  const byGame = new Map<number, { players: string[]; name: string }>();
  const byNight = new Map<string, number>();
  for (const w of wedgies) {
    const played = w.gameId == null ? undefined : gamesById.get(w.gameId);
    if (played) {
      const g = byGame.get(played.id) ?? {
        players: [],
        name: gameLabel(played),
      };
      g.players.push(w.playerName);
      byGame.set(played.id, g);
    }
    const night = w.wedgieDate.slice(0, 10);
    byNight.set(night, (byNight.get(night) ?? 0) + 1);
  }
  const topGame = [...byGame.values()].sort(
    (a, b) => b.players.length - a.players.length,
  )[0];
  const nightMax = Math.max(0, ...byNight.values());

  let drought = {
    games: 0,
    fromPlayer: "",
    fromDate: "",
    toPlayer: "",
    toDate: "",
  };
  let run = 0;
  let last: { player: string; date: string } | null = null;
  for (const g of games) {
    const hit = byGame.get(g.id);
    if (!hit) {
      run++;
      continue;
    }
    if (last && run > drought.games) {
      drought = {
        games: run,
        fromPlayer: last.player,
        fromDate: last.date,
        toPlayer: hit.players[0]!,
        toDate: g.gameDate ?? g.createdAt.slice(0, 10),
      };
    }
    run = 0;
    last = {
      player: hit.players.at(-1)!,
      date: g.gameDate ?? g.createdAt.slice(0, 10),
    };
  }

  const careerCounts = new Map<string, number>();
  for (const w of wedgies)
    careerCounts.set(w.playerName, (careerCounts.get(w.playerName) ?? 0) + 1);
  const career = [...careerCounts]
    .map(([name, n]) => ({ name, count: n }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 6);

  return {
    positions,
    types,
    quarters: Object.entries(quarterCounts).map(([label, n]) => ({
      label,
      count: n,
    })),
    knownMoments,
    totalWedgies: wedgies.length,
    records: {
      mostInGame: topGame
        ? { count: topGame.players.length, game: topGame.name }
        : null,
      mostInNight: {
        count: nightMax,
        dates: [...byNight]
          .filter(([, n]) => n === nightMax)
          .map(([d]) => d)
          .sort(),
      },
      multiGames: [...byGame.values()].filter((g) => g.players.length > 1)
        .length,
      drought,
    },
    career,
  };
}
