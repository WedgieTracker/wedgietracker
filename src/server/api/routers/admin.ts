import { z } from "zod";
import { unstable_cache } from "next/cache";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

import { db } from "~/server/db";
import { CACHE_TAGS, invalidateWedgieData } from "~/server/cache";

const getCachedGlobal = unstable_cache(
  async () => {
    const global = await db.global.findFirst({
      where: { id: 1 },
      include: { currentSeason: true },
    });
    return global ?? null;
  },
  ["admin-getGlobal"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 60 },
);

export const adminRouter = createTRPCRouter({
  getGlobal: publicProcedure.query(() => getCachedGlobal()),

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
      const result = await ctx.db.global.update({
        where: { id: 1 },
        data: input,
      });
      invalidateWedgieData();
      return result;
    }),
});
