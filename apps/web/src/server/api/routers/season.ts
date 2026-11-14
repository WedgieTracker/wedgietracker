import { ne, desc, eq, count } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { db } from "~/server/db";
import { global, season, wedgie } from "@wedgietracker/core/schema";
import { CACHE_TAGS } from "~/server/cache";
import { buildTeamStandings } from "~/server/db-helpers";

async function getCachedAll() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 300 });

  const seasons = await db.query.season.findMany({
    orderBy: desc(season.createdAt),
  });
  return seasons;
}

/** The entries tied for the highest count, in the order given. */
function leaders(list: { name: string; count: number }[]) {
  const top = list[0]?.count ?? 0;
  return {
    names: top ? list.filter((e) => e.count === top).map((e) => e.name) : [],
    count: top,
  };
}

async function getCachedAllWithStats() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 300 });

  const seasons = await db.query.season.findMany({
    where: ne(season.name, "GEMS"),
    orderBy: desc(season.name),
  });

  const globalRow = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });
  const currentSeason = globalRow?.currentSeason?.name;

  const seasonsWithStats = await Promise.all(
    seasons.map(async (s) => {
      const [wedgies, players] = await Promise.all([
        db
          .select({
            teamName: wedgie.teamName,
            teamAgainstName: wedgie.teamAgainstName,
          })
          .from(wedgie)
          .where(eq(wedgie.seasonName, s.name)),
        db
          .select({
            playerName: wedgie.playerName,
            count: count(),
          })
          .from(wedgie)
          .where(eq(wedgie.seasonName, s.name))
          .groupBy(wedgie.playerName)
          .orderBy(desc(count()), wedgie.playerName),
      ]);
      const teams = buildTeamStandings(wedgies);
      const topPlayers = players.map((p) => ({
        name: p.playerName,
        count: p.count,
      }));

      return {
        ...s,
        totalWedgies: wedgies.length,
        isCurrent: s.name === currentSeason,
        topPlayers: topPlayers.slice(0, 5),
        topTeams: teams.slice(0, 5),
        // Everyone tied for the most wedgies, which can be more than five.
        leadPlayers: leaders(topPlayers),
        leadTeams: leaders(teams),
      };
    }),
  );

  return seasonsWithStats;
}

async function getCachedAllWithGameCount() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 300 });

  const seasonsWithGames = await db.query.season.findMany({
    orderBy: desc(season.name),
    with: { games: { columns: { id: true } } },
  });

  return seasonsWithGames.map((s) => ({
    id: s.id,
    name: s.name,
    _count: { games: s.games.length },
  }));
}

async function getCachedSeasonalProgressChartData() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 300 });

  return db.query.season.findMany({
    where: ne(season.name, "GEMS"),
    with: { wedgies: true, games: true },
  });
}

export const seasonRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => getCachedAll()),

  getAllWithStats: publicProcedure.query(() => getCachedAllWithStats()),

  getAllWithGameCount: publicProcedure.query(() => getCachedAllWithGameCount()),

  getSeasonalProgressChartData: publicProcedure.query(() =>
    getCachedSeasonalProgressChartData(),
  ),
});
