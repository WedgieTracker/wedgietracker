import { z } from "zod";
import { like, desc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { game } from "~/server/schema";

export const gameRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        search: z.string(),
        take: z.number().optional().default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(game)
        .where(input.search ? like(game.name, `%${input.search}%`) : undefined)
        .orderBy(desc(game.createdAt))
        .limit(input.take);
    }),
});
