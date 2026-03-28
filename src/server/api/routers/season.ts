import { ne, desc, eq, count } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { db } from "~/server/db";
import { season, wedgie } from "~/server/schema";
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

async function getCachedAllWithStats() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 300 });

  const seasons = await db.query.season.findMany({
    where: ne(season.name, "GEMS"),
    orderBy: desc(season.name),
  });

  const seasonsWithStats = await Promise.all(
    seasons.map(async (s) => {
      const wedgies = await db
        .select({
          teamName: wedgie.teamName,
          teamAgainstName: wedgie.teamAgainstName,
        })
        .from(wedgie)
        .where(eq(wedgie.seasonName, s.name));

      const topPlayers = await db
        .select({
          playerName: wedgie.playerName,
          count: count(),
        })
        .from(wedgie)
        .where(eq(wedgie.seasonName, s.name))
        .groupBy(wedgie.playerName)
        .orderBy(desc(count()))
        .limit(5);

      return {
        ...s,
        totalWedgies: wedgies.length,
        topPlayers: topPlayers.map((p) => ({
          name: p.playerName,
          count: p.count,
        })),
        topTeams: buildTeamStandings(wedgies, { limit: 5 }),
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
