import { z } from "zod";
import { eq } from "drizzle-orm";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { invalidateWedgieData } from "~/server/cache";
import { player } from "~/server/schema";

export const playerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.player.findMany({
      with: { wedgies: true },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.player.findFirst({
        where: eq(player.id, parseInt(input.id)),
        with: { wedgies: true },
      });
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db.insert(player).values(input).returning();
      return result;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .update(player)
        .set({ name: input.name })
        .where(eq(player.id, parseInt(input.id)))
        .returning();
      invalidateWedgieData();
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .delete(player)
        .where(eq(player.id, parseInt(input.id)))
        .returning();
      invalidateWedgieData();
      return result;
    }),
});
