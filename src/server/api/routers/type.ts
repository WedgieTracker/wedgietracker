import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const typeRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.type.findMany({
      orderBy: { name: "asc" },
    });
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.type.findMany({
        where: {
          name: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        orderBy: { name: "asc" },
        take: 10,
      });
    }),

  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.type.create({
        data: input,
      });
    }),
});
