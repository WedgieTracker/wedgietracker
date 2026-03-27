import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { invalidateWedgieData } from "~/server/cache";

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.team.findMany({
      include: {
        teamGames: true,
        teamAgainstGames: true,
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findUnique({
        where: { id: parseInt(input.id) },
        include: {
          teamGames: true,
          teamAgainstGames: true,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.team.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.team.update({
        where: { id: parseInt(input.id) },
        data: { name: input.name },
      });
      invalidateWedgieData();
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.team.delete({
        where: { id: parseInt(input.id) },
      });
      invalidateWedgieData();
      return result;
    }),
});
