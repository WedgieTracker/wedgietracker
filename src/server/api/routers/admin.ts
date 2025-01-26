import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  getGlobal: publicProcedure.query(async ({ ctx }) => {
    const global = await ctx.db.global.findFirst({
      where: { id: 1 },
      include: {
        currentSeason: true,
      },
    });
    console.log(global);
    return global ?? null;
  }),

  updateGlobal: protectedProcedure
    .input(
      z.object({
        currentTotalWedgies: z.number(),
        currentTotalGames: z.number(),
        currentTotalMinutes: z.number(),
        currentTotalFGA: z.number(),
        currentTotalPoss: z.number(),
        pace: z.number(),
        simplePace: z.number(),
        mathPace: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.global.update({
        where: { id: 1 },
        data: input,
      });
    }),
});
