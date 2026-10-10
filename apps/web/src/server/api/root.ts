import { wedgieRouter } from "~/server/api/routers/wedgie";
import { adminRouter } from "~/server/api/routers/admin";
import { seasonRouter } from "~/server/api/routers/season";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { playerRouter } from "./routers/player";
import { teamRouter } from "./routers/team";
import { gameRouter } from "./routers/game";
import { typeRouter } from "./routers/type";
import { donationsRouter } from "./routers/donations";
import { reportRouter } from "./routers/report";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  wedgie: wedgieRouter,
  admin: adminRouter,
  season: seasonRouter,
  player: playerRouter,
  team: teamRouter,
  game: gameRouter,
  type: typeRouter,
  donations: donationsRouter,
  report: reportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
