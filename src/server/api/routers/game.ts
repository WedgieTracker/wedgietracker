import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

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
});
