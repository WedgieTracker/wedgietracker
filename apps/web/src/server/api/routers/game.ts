import { z } from "zod";
import { like, desc, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { game } from "@wedgietracker/core/schema";

export const gameRouter = createTRPCRouter({
  // Finds a game by its NBA label ("POR @ HOU", away team first), either team, or its day
  // ("2018-03-24"); never by the old name, whose teams are the other way round
  search: publicProcedure
    .input(
      z.object({
        search: z.string(),
        take: z.number().optional().default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const term = `%${input.search.trim()}%`;
      return ctx.db
        .select()
        .from(game)
        .where(
          input.search.trim()
            ? like(
                sql`${game.awayTeam} || ' @ ' || ${game.homeTeam} || ' ' || ${game.gameDate}`,
                term,
              )
            : undefined,
        )
        .orderBy(desc(game.createdAt))
        .limit(input.take);
    }),
});
