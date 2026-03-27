import { z } from "zod";
import { like, asc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type } from "~/server/schema";

export const typeRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(type).orderBy(asc(type.name));
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(type)
        .where(like(type.name, `%${input.query}%`))
        .orderBy(asc(type.name))
        .limit(10);
    }),

  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db.insert(type).values(input).returning();
      return result;
    }),
});
