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

        const topTeams = await ctx.db.wedgie.groupBy({
          by: ["teamName"],
          where: { seasonName: season.name },
          _count: {
            teamName: true,
          },
          orderBy: {
            _count: {
              teamName: "desc",
            },
          },
          take: 5,
        });

        return {
          ...season,
          totalWedgies: wedgies.length,
          topPlayers: topPlayers.map((p) => ({
            name: p.playerName,
            count: p._count.playerName,
          })),
          topTeams: topTeams.map((t) => ({
            name: t.teamName,
            count: t._count.teamName,
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
