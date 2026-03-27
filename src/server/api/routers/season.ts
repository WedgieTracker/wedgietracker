import { unstable_cache } from "next/cache";

import {
  createTRPCRouter,
  publicProcedure,
  // protectedProcedure,
} from "~/server/api/trpc";

import { db } from "~/server/db";
import { CACHE_TAGS } from "~/server/cache";

const getCachedAll = unstable_cache(
  async () => {
    const seasons = await db.season.findMany({
      orderBy: { createdAt: "desc" },
    });
    return seasons ?? null;
  },
  ["season-getAll"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

const getCachedAllWithStats = unstable_cache(
  async () => {
    const seasons = await db.season.findMany({
      where: { NOT: { name: "GEMS" } },
      orderBy: { name: "desc" },
    });

    const seasonsWithStats = await Promise.all(
      seasons.map(async (season) => {
        const wedgies = await db.wedgie.findMany({
          where: { seasonName: season.name },
          select: { teamName: true, teamAgainstName: true },
        });

        const topPlayers = await db.wedgie.groupBy({
          by: ["playerName"],
          where: { seasonName: season.name },
          _count: { playerName: true },
          orderBy: { _count: { playerName: "desc" } },
          take: 5,
        });

        const teamCounts = new Map<string, number>();
        wedgies.forEach((wedgie) => {
          teamCounts.set(
            wedgie.teamName,
            (teamCounts.get(wedgie.teamName) ?? 0) + 1,
          );
          teamCounts.set(
            wedgie.teamAgainstName,
            (teamCounts.get(wedgie.teamAgainstName) ?? 0) + 1,
          );
        });

        const topTeams = Array.from(teamCounts.entries())
          .sort((a, b) => {
            const countDiff = b[1] - a[1];
            if (countDiff !== 0) return countDiff;
            return a[0].localeCompare(b[0]);
          })
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        return {
          ...season,
          totalWedgies: wedgies.length,
          topPlayers: topPlayers.map((p) => ({
            name: p.playerName,
            count: p._count.playerName,
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
    const seasonsWithGames = await db.season.findMany({
      select: {
        id: true,
        name: true,
        games: { select: { id: true } },
      },
      orderBy: { name: "desc" },
    });

    return seasonsWithGames.map((season) => ({
      id: season.id,
      name: season.name,
      _count: { games: season.games.length },
    }));
  },
  ["season-getAllWithGameCount"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

const getCachedSeasonalProgressChartData = unstable_cache(
  async () => {
    return db.season.findMany({
      include: { wedgies: true, games: true },
      where: { NOT: { name: "GEMS" } },
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
