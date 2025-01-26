import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const gameRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        search: z.string(),
        take: z.number().optional().default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const games = await ctx.db.game.findMany({
        where: input.search
          ? {
              name: {
                contains: input.search,
                mode: "insensitive",
              },
            }
          : undefined,
        take: input.take,
        orderBy: {
          createdAt: "desc",
        },
      });
      return games;
    }),

  updateFutureSeasons: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const startDate = new Date("2024-10-01");
      const newSeasonName = "2024/25";

      // First ensure the season exists
      await ctx.db.season.upsert({
        where: { name: newSeasonName },
        create: { name: newSeasonName },
        update: {},
      });

      // Update all games after October 1, 2024
      const updatedGames = await ctx.db.game.updateMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        data: {
          seasonName: newSeasonName,
        },
      });

      return {
        success: true,
        updatedCount: updatedGames.count,
        message: `Successfully updated ${updatedGames.count} games to season ${newSeasonName}`,
      };
    } catch (error) {
      console.error("Error updating games:", error);
      throw new Error("Failed to update future games");
    }
  }),

  removeOldGames: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Delete all games before October 1, 2024
      const cutoffDate = new Date("2024-10-01");

      const deletedGames = await ctx.db.game.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return {
        success: true,
        deletedCount: deletedGames.count,
        message: `Successfully deleted ${deletedGames.count} games before October 2024`,
      };
    } catch (error) {
      console.error("Error deleting games:", error);
      throw new Error("Failed to delete old games");
    }
  }),
});
