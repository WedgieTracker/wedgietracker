import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { invalidateWedgieData } from "~/server/cache";
import { team } from "~/server/schema";

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.team.findMany({
      with: {
        teamGames: true,
        teamAgainstGames: true,
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.team.findFirst({
        where: eq(team.id, parseInt(input.id)),
        with: {
          teamGames: true,
          teamAgainstGames: true,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db.insert(team).values(input).returning();
      return result;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .update(team)
        .set({ name: input.name })
        .where(eq(team.id, parseInt(input.id)))
        .returning();
      invalidateWedgieData();
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .delete(team)
        .where(eq(team.id, parseInt(input.id)))
        .returning();
      invalidateWedgieData();
      return result;
    }),
});
