import { z } from "zod";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

import { db } from "~/server/db";
import { global } from "~/server/schema";
import { CACHE_TAGS, invalidateWedgieData } from "~/server/cache";

const getCachedGlobal = unstable_cache(
  async () => {
    const result = await db.query.global.findFirst({
      where: eq(global.id, 1),
      with: { currentSeason: true },
    });
    return result ?? null;
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
      const [result] = await ctx.db
        .update(global)
        .set(input)
        .where(eq(global.id, 1))
        .returning();
      invalidateWedgieData();
      return result;
    }),
});
