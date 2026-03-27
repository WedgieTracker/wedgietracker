import { ne, desc, eq, count } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

import { db } from "~/server/db";
import { season, wedgie } from "~/server/schema";
import { CACHE_TAGS } from "~/server/cache";

const getCachedAll = unstable_cache(
  async () => {
    const seasons = await db.query.season.findMany({
      orderBy: desc(season.createdAt),
    });
    return seasons ?? null;
  },
  ["season-getAll"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

const getCachedAllWithStats = unstable_cache(
  async () => {
    const seasons = await db.query.season.findMany({
      where: ne(season.name, "GEMS"),
      orderBy: desc(season.name),
    });

    const seasonsWithStats = await Promise.all(
      seasons.map(async (s) => {
        const wedgies = await db
          .select({ teamName: wedgie.teamName, teamAgainstName: wedgie.teamAgainstName })
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

        const teamCounts = new Map<string, number>();
        wedgies.forEach((w) => {
          teamCounts.set(w.teamName, (teamCounts.get(w.teamName) ?? 0) + 1);
          teamCounts.set(
            w.teamAgainstName,
            (teamCounts.get(w.teamAgainstName) ?? 0) + 1,
          );
        });

        const topTeams = Array.from(teamCounts.entries())
          .sort((a, b) => {
            const countDiff = b[1] - a[1];
            if (countDiff !== 0) return countDiff;
            return a[0].localeCompare(b[0]);
          })
          .slice(0, 5)
          .map(([name, cnt]) => ({ name, count: cnt }));

        return {
          ...s,
          totalWedgies: wedgies.length,
          topPlayers: topPlayers.map((p) => ({
            name: p.playerName,
            count: p.count,
          })),
          topTeams: topTeams.map((t) => ({
            name: t.name,
            count: t.count,
          })),
        };
      }),
    );

    return seasonsWithStats;
  },
  ["season-getAllWithStats"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

const getCachedAllWithGameCount = unstable_cache(
  async () => {
    const seasonsWithGames = await db.query.season.findMany({
      orderBy: desc(season.name),
      with: { games: { columns: { id: true } } },
    });

    return seasonsWithGames.map((s) => ({
      id: s.id,
      name: s.name,
      _count: { games: s.games.length },
    }));
  },
  ["season-getAllWithGameCount"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

const getCachedSeasonalProgressChartData = unstable_cache(
  async () => {
    return db.query.season.findMany({
      where: ne(season.name, "GEMS"),
      with: { wedgies: true, games: true },
    });
  },
  ["season-getSeasonalProgressChartData"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

export const seasonRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => getCachedAll()),

  getAllWithStats: publicProcedure.query(() => getCachedAllWithStats()),

  getAllWithGameCount: publicProcedure.query(() => getCachedAllWithGameCount()),

  getSeasonalProgressChartData: publicProcedure.query(() =>
    getCachedSeasonalProgressChartData(),
  ),
});
