import {
  createTRPCRouter,
  publicProcedure,
  // protectedProcedure,
} from "~/server/api/trpc";

export const seasonRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const seasons = await ctx.db.season.findMany({
      orderBy: { createdAt: "desc" },
    });

    return seasons ?? null;
  }),

  getAllWithStats: publicProcedure.query(async ({ ctx }) => {
    const seasons = await ctx.db.season.findMany({
      where: {
        NOT: {
          name: "GEMS",
        },
      },
      orderBy: { name: "desc" },
    });

    const seasonsWithStats = await Promise.all(
      seasons.map(async (season) => {
        const wedgies = await ctx.db.wedgie.findMany({
          where: { seasonName: season.name },
          select: {
            teamName: true,
            teamAgainstName: true,
          },
        });

        const topPlayers = await ctx.db.wedgie.groupBy({
          by: ["playerName"],
          where: { seasonName: season.name },
          _count: {
            playerName: true,
          },
          orderBy: {
            _count: {
              playerName: "desc",
            },
          },
          take: 5,
        });

        // Count wedgies for each team based on the includeOpponents setting
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

        // Convert to array and sort
        const topTeams = Array.from(teamCounts.entries())
          .sort((a, b) => {
            // First sort by count descending
            const countDiff = b[1] - a[1];
            if (countDiff !== 0) return countDiff;
            // If counts are equal, sort by team name ascending
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
  }),

  getAllWithGameCount: publicProcedure.query(async ({ ctx }) => {
    const seasonsWithGames = await ctx.db.season.findMany({
      select: {
        id: true,
        name: true,
        games: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: "desc",
      },
    });

    return seasonsWithGames.map((season) => ({
      id: season.id,
      name: season.name,
      _count: {
        games: season.games.length,
      },
    }));
  }),

  getSeasonalProgressChartData: publicProcedure.query(async ({ ctx }) => {
    const seasons = await ctx.db.season.findMany({
      include: {
        wedgies: true,
        games: true,
      },
      where: {
        NOT: {
          name: "GEMS",
        },
      },
    });

    return seasons;
  }),
});
