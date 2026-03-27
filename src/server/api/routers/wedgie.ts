import { z } from "zod";

import { unstable_cache } from "next/cache";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

import { db } from "~/server/db";
import { calculatePace } from "~/utils/paceCalculator";
import {
  CACHE_TAGS,
  invalidateWedgieData,
  invalidateStoreData,
} from "~/server/cache";

interface VideoUrl {
  youtube?: string;
  youtubeShort?: string;
  cloudinary?: string;
  youtubeNoDunks?: string;
  instagram?: string;
}

const wedgieInput = z.object({
  playerName: z.string(),
  teamName: z.string(),
  teamAgainstName: z.string(),
  number: z.number(),
  seasonName: z.string(),
  wedgieDate: z.date(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .nullable(),
  videoUrl: z.object({
    selfHosted: z.string().optional(),
    youtube: z.string().optional(),
    cloudinary: z.string().optional(),
    youtubeNoDunks: z.string().optional(),
    instagram: z.string().optional(),
  }),
  types: z.array(z.string()),
  gameName: z.string().optional(),
});

// --- Cached query functions ---

const getCachedAll = unstable_cache(
  async () => {
    const wedgies = await db.wedgie.findMany({
      orderBy: { createdAt: "desc" },
      include: { types: true },
    });
    return wedgies ?? null;
  },
  ["wedgie-getAll"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedBySeason = (season: string) =>
  unstable_cache(
    async () => {
      return db.wedgie.findMany({
        where: { Season: { is: { name: season } } },
        include: { types: true },
        orderBy: { number: "desc" },
      });
    },
    ["wedgie-getBySeason", season],
    { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
  )();

const getCachedLatest = unstable_cache(
  async () => {
    return db.wedgie.findFirst({
      orderBy: { createdAt: "desc" },
    });
  },
  ["wedgie-getLatest"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedLatestWedgies = unstable_cache(
  async () => {
    return db.wedgie.findMany({
      take: 13,
      orderBy: { wedgieDate: "desc" },
      include: { types: true },
    });
  },
  ["wedgie-getLatestWedgies"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedStats = unstable_cache(
  async () => {
    const globalSettings = await db.global.findFirst({
      where: { id: 1 },
      select: {
        currentTotalWedgies: true,
        pace: true,
        simplePace: true,
        mathPace: true,
        currentTotalGames: true,
        liveGames: true,
        currentSeason: true,
      },
    });

    if (!globalSettings) {
      throw new Error("No global settings found");
    }

    const lastWedgie = await db.wedgie.findFirst({
      orderBy: { wedgieDate: "desc" },
      select: { wedgieDate: true },
    });

    const currentSeasonWedgies = await db.wedgie.count({
      where: { seasonName: globalSettings.currentSeason.name },
    });

    let dateNow: Date | null = null;
    if (currentSeasonWedgies < globalSettings.currentTotalWedgies) {
      dateNow = new Date();
    }

    return {
      totalWedgies: globalSettings.currentTotalWedgies ?? 0,
      currentPace: globalSettings.pace ?? 0,
      simplePace: globalSettings.simplePace ?? 0,
      mathPace: globalSettings.mathPace ?? 0,
      gamesPlayed: globalSettings.currentTotalGames ?? 0,
      lastWedgie: dateNow ?? lastWedgie?.wedgieDate ?? null,
      liveGames: globalSettings.liveGames ?? false,
      currentSeasonWedgies: currentSeasonWedgies,
    };
  },
  ["wedgie-getStats"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 60 },
);

const getCachedTopStandings = unstable_cache(
  async () => {
    const currentSeasonGlobal = await db.global.findFirst({
      where: { id: 1 },
      include: { currentSeason: true },
    });

    const currentSeason = currentSeasonGlobal?.currentSeason.name;

    const topPlayers = await db.wedgie.groupBy({
      by: ["playerName"],
      where: { seasonName: currentSeason },
      _count: { playerName: true },
      orderBy: [
        { _count: { playerName: "desc" } },
        { playerName: "asc" },
      ],
      take: 5,
    });

    const wedgies = await db.wedgie.findMany({
      where: { seasonName: currentSeason },
      select: { teamName: true, teamAgainstName: true },
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
      players: topPlayers.map((p) => ({
        name: p.playerName,
        count: p._count.playerName,
      })),
      teams: topTeams,
    };
  },
  ["wedgie-getTopStandings"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedSeasonStandings = (
  season: string,
  includeOpponents: boolean,
) =>
  unstable_cache(
    async () => {
      const whereClause = season ? { seasonName: season } : {};

      const topPlayers = await db.wedgie.groupBy({
        by: ["playerName"],
        where: whereClause,
        _count: { playerName: true },
        orderBy: [
          { _count: { playerName: "desc" } },
          { playerName: "asc" },
        ],
      });

      const wedgies = await db.wedgie.findMany({
        where: whereClause,
        select: { teamName: true, teamAgainstName: true },
      });

      const teamCounts = new Map<string, number>();
      wedgies.forEach((wedgie) => {
        teamCounts.set(
          wedgie.teamName,
          (teamCounts.get(wedgie.teamName) ?? 0) + 1,
        );
        if (includeOpponents) {
          teamCounts.set(
            wedgie.teamAgainstName,
            (teamCounts.get(wedgie.teamAgainstName) ?? 0) + 1,
          );
        }
      });

      const topTeams = Array.from(teamCounts.entries())
        .sort((a, b) => {
          const countDiff = b[1] - a[1];
          if (countDiff !== 0) return countDiff;
          return a[0].localeCompare(b[0]);
        })
        .map(([name, count]) => ({ name, count }));

      return {
        players: topPlayers
          .filter((p) => p.playerName)
          .map((p) => ({
            name: p.playerName,
            count: p._count.playerName,
          })),
        teams: topTeams,
      };
    },
    ["wedgie-getSeasonStandings", season, String(includeOpponents)],
    { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
  )();

const getCachedNerdStats = unstable_cache(
  async () => {
    const global = await db.global.findFirst({
      where: { id: 1 },
      include: { currentSeason: true },
    });

    const currentSeason = global?.currentSeason.name;

    const allPlayers = await db.wedgie.groupBy({
      by: ["playerName"],
      where: { seasonName: currentSeason },
      _count: { playerName: true },
    });
    const maxWedgies = Math.max(
      ...allPlayers.map((player) => player._count.playerName),
    );
    const topPlayers = allPlayers.filter(
      (player) => player._count.playerName === maxWedgies,
    );

    const wedgies = await db.wedgie.findMany({
      where: { seasonName: currentSeason },
      select: { teamName: true, teamAgainstName: true },
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
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count: count }));

    const wedgiesThisSeason = await db.wedgie.count({
      where: { seasonName: currentSeason },
    });

    const totalFGA = await db.global.findFirst({
      where: { id: 1 },
      select: { currentTotalFGA: true },
    });

    const fgaPerWedgie = totalFGA
      ? totalFGA.currentTotalFGA / wedgiesThisSeason
      : 0;

    const lastWedgie = await db.wedgie.findFirst({
      orderBy: { wedgieDate: "desc" },
      select: { wedgieDate: true, playerName: true },
    });

    const gamesSinceLastWedgie = lastWedgie
      ? await db.game.count({
          where: {
            createdAt: { gt: lastWedgie.wedgieDate },
            live: false,
          },
        })
      : 0;

    const currentSeasonWedgies = wedgies.length;

    const hideGamesSinceLastWedgie =
      currentSeasonWedgies < (global?.currentTotalWedgies ?? 0) ? true : false;

    const seasons = await db.season.findMany({
      where: {
        AND: [
          { name: { not: "GEMS" } },
          { name: { not: currentSeason } },
        ],
      },
      include: { wedgies: true },
    });

    const seasonRates = seasons
      .map((season) => ({
        wedgies: season.wedgies.length,
        games: season.totalGames,
        rate:
          season.totalGames > 0 ? season.wedgies.length / season.totalGames : 0,
      }))
      .filter((season) => season.rate > 0);

    const averageSeasonRate = Math.round(
      seasonRates.reduce((acc, season) => acc + season.wedgies, 0) /
        seasonRates.length,
    );

    const totalSeasonsOverall = seasons.length;

    const totalWedgiesOverall = seasons.reduce(
      (acc, season) => acc + season.wedgies.length,
      0,
    );

    const totalGamesOverall = seasons.reduce(
      (acc, season) => acc + season.totalGames,
      0,
    );

    const globalGames = global?.currentTotalGames ?? 0;

    return {
      currentSeason: currentSeason ?? "2025/26",
      wedgiesThisSeason:
        currentSeasonWedgies > (global?.currentTotalWedgies ?? 0)
          ? currentSeasonWedgies
          : (global?.currentTotalWedgies ?? 0),
      fgaPerWedgie,
      pace: global?.pace ?? 0,
      averageLastTenSeasons: averageSeasonRate,
      ...(hideGamesSinceLastWedgie ? {} : { gamesSinceLastWedgie }),
      lastWedgiePlayer: lastWedgie?.playerName ?? null,
      statsPerWedgie: {
        fga: global
          ? Math.round(global.currentTotalFGA / wedgiesThisSeason)
          : 0,
        possessions: global
          ? Math.round(global.currentTotalPoss / wedgiesThisSeason)
          : 0,
        games: global
          ? Math.round(global.currentTotalGames / wedgiesThisSeason)
          : 0,
        minutes: global
          ? Math.round(global.currentTotalMinutes / wedgiesThisSeason)
          : 0,
      },
      leaders: {
        teams: topTeams.map((team) => ({
          name: team.name,
          wedgies: team.count,
        })),
        players: topPlayers.map((player) => ({
          name: player.playerName,
          count: player._count.playerName,
        })),
      },
      totalWedgiesOverall: totalWedgiesOverall + wedgiesThisSeason,
      totalGamesOverall: totalGamesOverall + globalGames,
      totalSeasonsOverall: totalSeasonsOverall + 1,
      oldSeasonsAverage: averageSeasonRate,
    };
  },
  ["wedgie-getNerdStats"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

const getCachedTotalWedgies = unstable_cache(
  async () => {
    return db.wedgie.count({
      where: { Season: { NOT: { name: "GEMS" } } },
    });
  },
  ["wedgie-getTotalWedgies"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

export const wedgieRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(() => getCachedAll()),

  getBySeason: publicProcedure
    .input(z.object({ season: z.string().min(1) }))
    .query(({ input }) => getCachedBySeason(input.season)),

  getByPlayer: publicProcedure
    .input(z.object({ player: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const wedgies = await ctx.db.wedgie.findMany({
        where: { Player: { is: { name: input.player } } },
      });
      return wedgies;
    }),

  getByType: publicProcedure
    .input(z.object({ type: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const wedgies = await ctx.db.wedgie.findMany({
        where: { types: { some: { name: input.type } } },
      });
      return wedgies;
    }),

  getLatest: publicProcedure.query(() => getCachedLatest()),

  create: protectedProcedure
    .input(wedgieInput)
    .mutation(async ({ ctx, input }) => {
      const wedgie = await ctx.db.wedgie.create({
        data: {
          ...input,
          position: input.position ?? undefined,
          types: {
            connectOrCreate: input.types.map((type) => ({
              where: { name: type },
              create: { name: type },
            })),
          },
        },
      });

      // check if the wedgie is in the current season
      const global = await ctx.db.global.findFirst({
        where: { id: 1 },
        include: { currentSeason: true },
      });

      if (global?.currentSeason.name === input.seasonName) {
        // get the current total wedgies
        const currentTotalWedgiesSeason = await ctx.db.wedgie.count({
          where: { seasonName: input.seasonName },
        });

        // get the current total from the global table
        const currentTotalWedgiesGlobal = global?.currentTotalWedgies;

        if (currentTotalWedgiesSeason > currentTotalWedgiesGlobal) {
          // update the global table
          await ctx.db.global.update({
            where: { id: 1 },
            data: { currentTotalWedgies: currentTotalWedgiesSeason },
          });
          // calculate the pace
          const pace = await calculatePace({
            currentTotalWedgies: currentTotalWedgiesSeason,
            currentTotalGames: global?.currentTotalGames,
          });

          // update the global table
          await ctx.db.global.update({
            where: { id: 1 },
            data: {
              simplePace: pace.simplePace,
              mathPace: pace.rmPace,
              pace: pace.medianPace,
            },
          });
        }
      }

      invalidateWedgieData();
      invalidateStoreData();

      return wedgie;
    }),

  getSelfHostedVideos: publicProcedure.query(async ({ ctx }) => {
    const wedgies = await ctx.db.wedgie.findMany({
      where: {
        AND: [
          {
            videoUrl: {
              path: ["selfHosted"],
              not: { equals: null },
            },
          },
          {
            Season: {
              name: {
                not: "GEMS",
              },
            },
          },
        ],
      },
      select: {
        id: true,
        wedgieDate: true,
        videoUrl: true,
        playerName: true,
        teamName: true,
        teamAgainstName: true,
        number: true,
        seasonName: true,
      },
    });

    // return wedgies;

    // Filter and sort by wedgieDate
    return wedgies
      .filter((wedgie) => !(wedgie.videoUrl as VideoUrl).youtube)
      .sort(
        (a, b) =>
          new Date(b.wedgieDate).getTime() - new Date(a.wedgieDate).getTime(),
      );
  }),

  // uploadSelfHostedToYoutube: protectedProcedure.mutation(async ({ ctx }) => {
  //   // Get self-hosted videos with their position number in the season
  //   const wedgies = await ctx.db.wedgie.findMany({
  //     where: {
  //       videoUrl: {
  //         path: ["selfHosted"],
  //         not: { equals: null },
  //       },
  //       Season: {
  //         NOT: {
  //           name: "GEMS",
  //         },
  //       },
  //     },
  //     include: {
  //       Player: true,
  //       Season: true,
  //       Game: true,
  //     },
  //     orderBy: {
  //       wedgieDate: "desc",
  //     },
  //     take: 5,
  //   });

  //   const filteredWedgies = wedgies.filter((wedgie) => {
  //     return !(wedgie.videoUrl as VideoUrl).youtube;
  //   });

  //   // console.log("wedgies", wedgies);

  //   const results = [];

  //   for (const wedgie of filteredWedgies) {
  //     try {
  //       // Download the video first
  //       const videoUrl = (wedgie.videoUrl as VideoUrl).selfHosted;
  //       if (!videoUrl) continue;

  //       const tempPath = `/tmp/${Date.now()}_${path.basename(videoUrl)}`;
  //       await downloadFile(videoUrl, tempPath);

  //       // Get the wedgie number (count of wedgies in the same season up to this date)
  //       const wedgieNumber = wedgie.number;

  //       const seasonYears = wedgie.Season.name.split("/");

  //       if (!seasonYears[0] || !seasonYears[1]) {
  //         console.log("skipping", wedgie.id);
  //         continue;
  //       }
  //       console.log("seasonYears", seasonYears);
  //       // const formattedSeason = `${seasonYears[0].slice(-2)}/${seasonYears[1].slice(-2)}`;

  //       // console.log("wedgie", wedgie);
  //       if (!wedgie.teamName || !wedgieNumber || !wedgie.teamAgainstName) {
  //         console.log("skipping", wedgie);
  //         continue;
  //       }
  //       console.log("wedgie", wedgie.teamName, wedgie.teamAgainstName);
  //       console.log("wedgieNumber", wedgieNumber);

  //       return;

  //       // const uploadResult = await uploadToYoutube(
  //       //   tempPath,
  //       //   title,
  //       //   description,
  //       //   [],
  //       //   session,
  //       //   wedgieNumber,
  //       //   wedgie.Season.name,
  //       //   wedgie.Player.name,
  //       // );

  //       // // Clean up the temporary file
  //       // await fs.promises.unlink(tempPath);

  //       // // Update the wedgie record with YouTube URLs
  //       // if (!uploadResult.original || !uploadResult.short) {
  //       //   continue;
  //       // }
  //       // await ctx.db.wedgie.update({
  //       //   where: { id: wedgie.id },
  //       //   data: {
  //       //     videoUrl: {
  //       //       ...(wedgie.videoUrl as VideoUrl),
  //       //       youtube: uploadResult.original.videoUrl,
  //       //       youtubeShort: uploadResult.short.videoUrl,
  //       //     },
  //       //   },
  //       // });

  //       // results.push({
  //       //   id: wedgie.id,
  //       //   success: true,
  //       //   youtubeUrl: uploadResult.original.videoUrl,
  //       //   youtubeShortUrl: uploadResult.short.videoUrl,
  //       // });
  //     } catch (error) {
  //       const errorMessage =
  //         error instanceof Error ? error.message : "Unknown error occurred";
  //       results.push({
  //         id: wedgie.id,
  //         success: false,
  //         error: errorMessage,
  //       });
  //     }
  //   }

  //   return results;
  // }),

  getLatestWedgies: publicProcedure.query(() => getCachedLatestWedgies()),

  getStats: publicProcedure.query(() => getCachedStats()),

  getCloudinaryWedgies: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.wedgie.findMany({
      where: {
        videoUrl: {
          path: ["cloudinary"],
          not: { equals: null },
        },
      },
      select: {
        id: true,
        playerName: true,
        teamName: true,
        teamAgainstName: true,
        number: true,
        seasonName: true,
        videoUrl: true,
      },
      orderBy: {
        wedgieDate: "desc",
      },
    });
  }),

  getTopStandings: publicProcedure.query(() => getCachedTopStandings()),

  getSeasonStandings: publicProcedure
    .input(
      z.object({
        season: z.string(),
        includeOpponents: z.boolean().default(true),
      }),
    )
    .query(({ input }) =>
      getCachedSeasonStandings(input.season, input.includeOpponents),
    ),

  getNerdStats: publicProcedure.query(() => getCachedNerdStats()),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.wedgie.findUnique({
        where: { id: Number(input.id) },
        include: {
          types: true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: wedgieInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const wedgie = await ctx.db.wedgie.update({
        where: { id: input.id },
        data: {
          ...input.data,
          position: input.data.position ?? undefined,
          types: {
            set: [],
            connectOrCreate: input.data.types.map((type) => ({
              where: { name: type },
              create: { name: type },
            })),
          },
        },
      });

      // check if the wedgie is in the current season
      const global = await ctx.db.global.findFirst({
        where: { id: 1 },
        include: { currentSeason: true },
      });

      if (global?.currentSeason.name === input.data.seasonName) {
        // get the current total wedgies
        const currentTotalWedgiesSeason = await ctx.db.wedgie.count({
          where: { seasonName: input.data.seasonName },
        });

        // get the current total from the global table
        const currentTotalWedgiesGlobal = global?.currentTotalWedgies;

        if (currentTotalWedgiesSeason > currentTotalWedgiesGlobal) {
          // update the global table
          await ctx.db.global.update({
            where: { id: 1 },
            data: { currentTotalWedgies: currentTotalWedgiesSeason },
          });
          // calculate the pace
          const pace = await calculatePace({
            currentTotalWedgies: currentTotalWedgiesSeason,
            currentTotalGames: global?.currentTotalGames,
          });

          // update the global table
          await ctx.db.global.update({
            where: { id: 1 },
            data: {
              simplePace: pace.simplePace,
              mathPace: pace.rmPace,
              pace: pace.medianPace,
            },
          });
        }
      }

      invalidateWedgieData();

      return wedgie;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.wedgie.delete({
        where: { id: Number(input.id) },
      });
      invalidateWedgieData();
      invalidateStoreData();
      return result;
    }),

  getTotalWedgies: publicProcedure.query(() => getCachedTotalWedgies()),
});
