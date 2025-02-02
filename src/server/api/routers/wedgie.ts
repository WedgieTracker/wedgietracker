import { z } from "zod";

import { google } from "googleapis";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

import { calculatePace } from "~/utils/paceCalculator";

interface VideoUrl {
  youtube?: string;
  youtubeShort?: string;
  cloudinary?: string;
  youtubeNoDunks?: string;
  instagram?: string;
}

interface YouTubeVideoItem {
  id?: {
    videoId: string;
  };
  snippet?: {
    title: string;
  };
}

interface YouTubeApiResponse {
  items: YouTubeVideoItem[];
  nextPageToken?: string;
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

export const wedgieRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const wedgies = await ctx.db.wedgie.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        types: true,
      },
    });

    return wedgies ?? null;
  }),

  getBySeason: publicProcedure
    .input(z.object({ season: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const wedgies = await ctx.db.wedgie.findMany({
        where: { Season: { is: { name: input.season } } },
        include: {
          types: true,
        },
        orderBy: {
          number: "desc",
        },
      });
      return wedgies;
    }),

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

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const wedgies = await ctx.db.wedgie.findFirst({
      orderBy: { createdAt: "desc" },
    });
    return wedgies;
  }),

  create: protectedProcedure
    .input(wedgieInput)
    .mutation(async ({ ctx, input }) => {
      const wedgie = await ctx.db.wedgie.create({
        data: {
          ...input,
          position: input.position ? JSON.stringify(input.position) : undefined,
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

  getLatestWedgies: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.wedgie.findMany({
      take: 13,
      orderBy: { wedgieDate: "desc" },
      include: {
        types: true,
      },
    });
  }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const globalSettings = await ctx.db.global.findFirst({
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

    // get the date of the last wedgie
    const lastWedgie = await ctx.db.wedgie.findFirst({
      orderBy: { wedgieDate: "desc" },
      select: {
        wedgieDate: true,
      },
    });

    console.log("lastWedgie", lastWedgie);

    // count the number of wedgies in the current season
    const currentSeasonWedgies = await ctx.db.wedgie.count({
      where: {
        seasonName: globalSettings.currentSeason.name,
      },
    });

    let dateNow: Date | null = null;

    if (currentSeasonWedgies < globalSettings.currentTotalWedgies) {
      dateNow = new Date();
    }

    console.log("dateNow", dateNow, lastWedgie?.wedgieDate);

    return {
      totalWedgies: globalSettings.currentTotalWedgies ?? 0,
      currentPace: globalSettings.pace ?? 0,
      simplePace: globalSettings.simplePace ?? 0,
      mathPace: globalSettings.mathPace ?? 0,
      gamesPlayed: globalSettings.currentTotalGames ?? 0,
      lastWedgie: dateNow ?? lastWedgie?.wedgieDate ?? null,
      liveGames: globalSettings.liveGames ?? false,
    };
  }),

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

  getTopStandings: publicProcedure.query(async ({ ctx }) => {
    const currentSeasonGlobal = await ctx.db.global.findFirst({
      where: { id: 1 },
      include: { currentSeason: true },
    });

    const currentSeason = currentSeasonGlobal?.currentSeason.name;

    // Get top 5 players
    const topPlayers = await ctx.db.wedgie.groupBy({
      by: ["playerName"],
      where: {
        seasonName: currentSeason,
      },
      _count: {
        playerName: true,
      },
      orderBy: [
        {
          _count: {
            playerName: "desc",
          },
        },
        {
          playerName: "asc",
        },
      ],
      take: 5,
    });

    // Get all wedgies for the current season
    const wedgies = await ctx.db.wedgie.findMany({
      where: {
        seasonName: currentSeason,
      },
      select: {
        teamName: true,
        teamAgainstName: true,
      },
    });

    // Count wedgies for each team (both as team and opponent)
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
      players: topPlayers.map((p) => ({
        name: p.playerName,
        count: p._count.playerName,
      })),
      teams: topTeams,
    };
  }),

  getSeasonStandings: publicProcedure
    .input(
      z.object({
        season: z.string(),
        includeOpponents: z.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause = input.season ? { seasonName: input.season } : {};

      // Get players
      const topPlayers = await ctx.db.wedgie.groupBy({
        by: ["playerName"],
        where: whereClause,
        _count: {
          playerName: true,
        },
        orderBy: [
          {
            _count: {
              playerName: "desc",
            },
          },
          {
            playerName: "asc",
          },
        ],
      });

      // Get all wedgies for the season
      const wedgies = await ctx.db.wedgie.findMany({
        where: whereClause,
        select: {
          teamName: true,
          teamAgainstName: true,
        },
      });

      // Count wedgies for each team based on the includeOpponents setting
      const teamCounts = new Map<string, number>();
      wedgies.forEach((wedgie) => {
        teamCounts.set(
          wedgie.teamName,
          (teamCounts.get(wedgie.teamName) ?? 0) + 1,
        );

        // Only count opponent teams if includeOpponents is true
        if (input.includeOpponents) {
          teamCounts.set(
            wedgie.teamAgainstName,
            (teamCounts.get(wedgie.teamAgainstName) ?? 0) + 1,
          );
        }
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
    }),

  getNerdStats: publicProcedure.query(async ({ ctx }) => {
    // Get current season
    const global = await ctx.db.global.findFirst({
      where: { id: 1 },
      include: { currentSeason: true },
    });

    const currentSeason = global?.currentSeason.name;

    // Get top players for current season
    const topPlayers = await ctx.db.wedgie.groupBy({
      by: ["playerName"],
      where: {
        seasonName: currentSeason,
      },
      _count: {
        playerName: true,
      },
      orderBy: {
        _count: {
          playerName: "desc",
        },
      },
    });

    // Get all wedgies for current season to count team involvement
    const wedgies = await ctx.db.wedgie.findMany({
      where: {
        seasonName: currentSeason,
      },
      select: {
        teamName: true,
        teamAgainstName: true,
      },
    });

    // Count wedgies for each team (both as team and opponent)
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
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count: count }));

    // Get total wedgies this season
    const wedgiesThisSeason = await ctx.db.wedgie.count({
      where: {
        seasonName: currentSeason,
      },
    });

    // Get total FGA this season
    const totalFGA = await ctx.db.global.findFirst({
      where: { id: 1 },
      select: { currentTotalFGA: true },
    });

    // Calculate FGA per wedgie
    const fgaPerWedgie = totalFGA
      ? totalFGA.currentTotalFGA / wedgiesThisSeason
      : 0;

    // Get games since last wedgie
    const lastWedgie = await ctx.db.wedgie.findFirst({
      orderBy: { wedgieDate: "desc" },
      select: {
        wedgieDate: true,
        playerName: true,
      },
    });

    // Calculate games since last wedgie using the global currentTotalGames
    const gamesSinceLastWedgie = lastWedgie
      ? await ctx.db.game.count({
          where: {
            createdAt: {
              gt: lastWedgie.wedgieDate,
            },
          },
        })
      : 0;

    const currentSeasonWedgies = wedgies.length;

    const hideGamesSinceLastWedgie =
      currentSeasonWedgies < (global?.currentTotalWedgies ?? 0) ? true : false;

    // Get all seasons excluding current and gems
    const seasons = await ctx.db.season.findMany({
      where: {
        AND: [
          { name: { not: "GEMS" } },
          { name: { not: currentSeason } }, // Exclude current season
        ],
      },
      include: {
        wedgies: true,
      },
    });

    // Calculate rate for each season and filter out seasons with 0 rate
    const seasonRates = seasons
      .map((season) => ({
        wedgies: season.wedgies.length,
        games: season.totalGames,
        rate:
          season.totalGames > 0 ? season.wedgies.length / season.totalGames : 0,
      }))
      .filter((season) => season.rate > 0);

    // Calculate average rate
    const averageSeasonRate = Math.round(
      seasonRates.reduce((acc, season) => acc + season.wedgies, 0) /
        seasonRates.length,
    );

    // count the number of seasons
    const totalSeasonsOverall = seasons.length;

    // sum up the total number of wedgies
    const totalWedgiesOverall = seasons.reduce(
      (acc, season) => acc + season.wedgies.length,
      0,
    );

    // sum up the total number of games summing seasons.totalGames
    const totalGamesOverall = seasons.reduce(
      (acc, season) => acc + season.totalGames,
      0,
    );

    const globalGames = global?.currentTotalGames ?? 0;

    return {
      currentSeason: currentSeason ?? "2023/24",
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
  }),

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
      console.log("input.data.position");
      console.log(input.data.position);
      const wedgie = await ctx.db.wedgie.update({
        where: { id: input.id },
        data: {
          ...input.data,
          position: input.data.position ? input.data.position : undefined,
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

      return wedgie;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.wedgie.delete({
        where: { id: Number(input.id) },
      });
    }),

  getTotalWedgies: publicProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.wedgie.count({
      where: {
        Season: {
          NOT: {
            name: "GEMS",
          },
        },
      },
    });
    return total;
  }),

  updateYoutubeLinks: protectedProcedure.mutation(async ({ ctx }) => {
    const { session } = ctx;

    console.log("Starting YouTube link update...");

    if (!session?.user?.accessToken) {
      throw new Error("No access token found - please log in again");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    );

    oauth2Client.setCredentials({
      access_token: session.user.accessToken,
      token_type: "Bearer",
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    try {
      // Test the credentials in a separate try/catch first
      try {
        console.log("Testing credentials...");
        await youtube.channels.list({
          part: ["snippet"],
          mine: true,
        });
      } catch (error) {
        console.error("Error validating YouTube credentials:", error);
        throw new Error(
          "Invalid YouTube credentials - please try logging in again",
        );
      }

      let allVideos: YouTubeVideoItem[] = [];
      let nextPageToken: string | undefined = undefined;

      // Only proceed if credentials are valid
      console.log("Credentials valid, searching videos...");

      do {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&forMine=true&type=video&q=WEDGIE${
            nextPageToken ? `&pageToken=${nextPageToken}` : ""
          }`,
          {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
            },
          },
        );

        const data = (await response.json()) as YouTubeApiResponse;
        if (!data.items) break;

        allVideos = [...allVideos, ...data.items];
        nextPageToken = data.nextPageToken;

        console.log(`Fetched ${allVideos.length} videos so far...`);
      } while (nextPageToken);

      if (allVideos.length === 0) {
        return { success: false, message: "No videos found" };
      }

      console.log(`Processing ${allVideos.length} total videos...`);
      let updatedCount = 0;

      for (const video of allVideos) {
        const title = video.snippet?.title;
        if (!title) continue;

        const titleRegex = /^(.*?) WEDGIE No\. (\d+)/;
        const match = titleRegex.exec(title);
        if (!match) continue;

        const [, playerName, wedgieNumber] = match;
        const trimmedPlayerName = playerName?.trim() ?? "";

        const wedgie = await ctx.db.wedgie.findFirst({
          where: {
            playerName: trimmedPlayerName,
            number: parseInt(wedgieNumber ?? "0"),
          },
        });

        if (wedgie) {
          await ctx.db.wedgie.update({
            where: { id: wedgie.id },
            data: {
              videoUrl: {
                ...(wedgie.videoUrl as VideoUrl),
                youtube: `https://www.youtube.com/watch?v=${video.id?.videoId ?? ""}`,
              },
            },
          });
          updatedCount++;
        }
      }

      return {
        success: true,
        message: `Updated ${updatedCount} wedgies with YouTube links (from ${allVideos.length} total videos)`,
      };
    } catch (error) {
      console.error("Error updating YouTube links:", error);
      throw error;
    }
  }),
});
