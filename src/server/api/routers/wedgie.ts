import { z } from "zod";
import { eq, desc, ne, and, count, sql, asc, gt, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

import { db } from "~/server/db";
import {
  wedgie,
  type as typeTable,
  wedgieToType,
  global,
  season,
  game,
} from "~/server/schema";
import {
  CACHE_TAGS,
  invalidateWedgieData,
  invalidateStoreData,
} from "~/server/cache";
import {
  buildTeamStandings,
  maybeUpdateGlobalWedgieCount,
} from "~/server/db-helpers";
import { type VideoUrls } from "~/types/wedgie";

const wedgieInput = z.object({
  playerName: z.string(),
  teamName: z.string(),
  teamAgainstName: z.string(),
  number: z.number(),
  seasonName: z.string(),
  wedgieDate: z.date(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .nullable(),
  videoUrl: z.object({
    selfHosted: z.string().optional(),
    youtube: z.string().optional(),
    cloudinary: z.string().optional(),
    youtubeNoDunks: z.string().optional(),
    instagram: z.string().optional(),
  }),
  types: z.array(z.string()),
  gameName: z.string().optional(),
});

// Helper: connect or create types for a wedgie
async function syncWedgieTypes(
  trx: typeof db,
  wedgieId: number,
  typeNames: string[],
) {
  // Clear existing type associations
  await trx.delete(wedgieToType).where(eq(wedgieToType.wedgieId, wedgieId));

  for (const name of typeNames) {
    // Find or create the type
    let existing = await trx.query.type.findFirst({
      where: eq(typeTable.name, name),
    });
    if (!existing) {
      const [created] = await trx
        .insert(typeTable)
        .values({ name })
        .returning();
      existing = created;
    }
    // Create the join row
    await trx.insert(wedgieToType).values({ wedgieId, typeId: existing!.id });
  }
}

// Helper: get wedgies with their types via the join table
async function getWedgiesWithTypes(wedgieRows: { id: number }[]) {
  type TypeInfo = {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  if (wedgieRows.length === 0) return new Map<number, TypeInfo[]>();
  const wedgieIds = wedgieRows.map((w) => w.id);

  const joinRows = await db
    .select({
      wedgieId: wedgieToType.wedgieId,
      typeId: typeTable.id,
      typeName: typeTable.name,
      typeCreatedAt: typeTable.createdAt,
      typeUpdatedAt: typeTable.updatedAt,
    })
    .from(wedgieToType)
    .innerJoin(typeTable, eq(wedgieToType.typeId, typeTable.id))
    .where(inArray(wedgieToType.wedgieId, wedgieIds));

  const typesByWedgie = new Map<number, TypeInfo[]>();
  for (const row of joinRows) {
    const types = typesByWedgie.get(row.wedgieId) ?? [];
    types.push({
      id: row.typeId,
      name: row.typeName,
      createdAt: row.typeCreatedAt,
      updatedAt: row.typeUpdatedAt,
    });
    typesByWedgie.set(row.wedgieId, types);
  }
  return typesByWedgie;
}

// --- Cached query functions ---

const getCachedAll = unstable_cache(
  async () => {
    const wedgies = await db
      .select()
      .from(wedgie)
      .orderBy(desc(wedgie.createdAt));
    const typesMap = await getWedgiesWithTypes(wedgies);
    return wedgies.map((w) => ({ ...w, types: typesMap.get(w.id) ?? [] }));
  },
  ["wedgie-getAll"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedBySeason = (seasonName: string) =>
  unstable_cache(
    async () => {
      const wedgies = await db
        .select()
        .from(wedgie)
        .where(eq(wedgie.seasonName, seasonName))
        .orderBy(desc(wedgie.number));
      const typesMap = await getWedgiesWithTypes(wedgies);
      return wedgies.map((w) => ({ ...w, types: typesMap.get(w.id) ?? [] }));
    },
    ["wedgie-getBySeason", seasonName],
    { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
  )();

const getCachedLatest = unstable_cache(
  async () => {
    return db.query.wedgie.findFirst({
      orderBy: desc(wedgie.createdAt),
    });
  },
  ["wedgie-getLatest"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedLatestWedgies = unstable_cache(
  async () => {
    const wedgies = await db
      .select()
      .from(wedgie)
      .orderBy(desc(wedgie.wedgieDate))
      .limit(13);
    const typesMap = await getWedgiesWithTypes(wedgies);
    return wedgies.map((w) => ({ ...w, types: typesMap.get(w.id) ?? [] }));
  },
  ["wedgie-getLatestWedgies"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedStats = unstable_cache(
  async () => {
    const globalSettings = await db.query.global.findFirst({
      where: eq(global.id, 1),
      with: { currentSeason: true },
    });

    if (!globalSettings) {
      throw new Error("No global settings found");
    }

    const lastWedgie = await db.query.wedgie.findFirst({
      orderBy: desc(wedgie.wedgieDate),
      columns: { wedgieDate: true },
    });

    const [wedgieCountResult] = await db
      .select({ count: count() })
      .from(wedgie)
      .where(eq(wedgie.seasonName, globalSettings.currentSeason.name));
    const currentSeasonWedgies = wedgieCountResult?.count ?? 0;

    let dateNow: Date | null = null;
    if (currentSeasonWedgies < globalSettings.currentTotalWedgies) {
      dateNow = new Date();
    }

    return {
      totalWedgies: globalSettings.currentTotalWedgies ?? 0,
      currentPace: globalSettings.pace ?? 0,
      simplePace: globalSettings.simplePace ?? 0,
      mathPace: globalSettings.mathPace ?? 0,
      gamesPlayed: globalSettings.currentTotalGames ?? 0,
      lastWedgie: dateNow ?? lastWedgie?.wedgieDate ?? null,
      liveGames: globalSettings.liveGames ?? false,
      currentSeasonWedgies: currentSeasonWedgies,
    };
  },
  ["wedgie-getStats"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 60 },
);

const getCachedTopStandings = unstable_cache(
  async () => {
    const currentSeasonGlobal = await db.query.global.findFirst({
      where: eq(global.id, 1),
      with: { currentSeason: true },
    });

    const currentSeason = currentSeasonGlobal?.currentSeason.name;

    const topPlayers = await db
      .select({ playerName: wedgie.playerName, count: count() })
      .from(wedgie)
      .where(eq(wedgie.seasonName, currentSeason!))
      .groupBy(wedgie.playerName)
      .orderBy(desc(count()), asc(wedgie.playerName))
      .limit(5);

    const wedgies = await db
      .select({
        teamName: wedgie.teamName,
        teamAgainstName: wedgie.teamAgainstName,
      })
      .from(wedgie)
      .where(eq(wedgie.seasonName, currentSeason!));

    return {
      players: topPlayers.map((p) => ({
        name: p.playerName,
        count: p.count,
      })),
      teams: buildTeamStandings(wedgies, { limit: 5 }),
    };
  },
  ["wedgie-getTopStandings"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

const getCachedSeasonStandings = (
  seasonFilter: string,
  includeOpponents: boolean,
) =>
  unstable_cache(
    async () => {
      const whereClause = seasonFilter
        ? eq(wedgie.seasonName, seasonFilter)
        : undefined;

      const topPlayers = await db
        .select({ playerName: wedgie.playerName, count: count() })
        .from(wedgie)
        .where(whereClause)
        .groupBy(wedgie.playerName)
        .orderBy(desc(count()), asc(wedgie.playerName));

      const wedgies = await db
        .select({
          teamName: wedgie.teamName,
          teamAgainstName: wedgie.teamAgainstName,
        })
        .from(wedgie)
        .where(whereClause);

      return {
        players: topPlayers
          .filter((p) => p.playerName)
          .map((p) => ({
            name: p.playerName,
            count: p.count,
          })),
        teams: buildTeamStandings(wedgies, { includeOpponents }),
      };
    },
    ["wedgie-getSeasonStandings", seasonFilter, String(includeOpponents)],
    { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
  )();

const getCachedNerdStats = unstable_cache(
  async () => {
    const globalRow = await db.query.global.findFirst({
      where: eq(global.id, 1),
      with: { currentSeason: true },
    });

    const currentSeason = globalRow?.currentSeason.name;

    const allPlayers = await db
      .select({ playerName: wedgie.playerName, count: count() })
      .from(wedgie)
      .where(eq(wedgie.seasonName, currentSeason!))
      .groupBy(wedgie.playerName);

    const maxWedgies = Math.max(...allPlayers.map((p) => p.count));
    const topPlayers = allPlayers.filter((p) => p.count === maxWedgies);

    const wedgies = await db
      .select({
        teamName: wedgie.teamName,
        teamAgainstName: wedgie.teamAgainstName,
      })
      .from(wedgie)
      .where(eq(wedgie.seasonName, currentSeason!));

    const topTeams = buildTeamStandings(wedgies);

    const [wedgiesThisSeasonResult] = await db
      .select({ count: count() })
      .from(wedgie)
      .where(eq(wedgie.seasonName, currentSeason!));
    const wedgiesThisSeason = wedgiesThisSeasonResult?.count ?? 0;

    const fgaPerWedgie = globalRow
      ? globalRow.currentTotalFGA / wedgiesThisSeason
      : 0;

    const lastWedgie = await db.query.wedgie.findFirst({
      orderBy: desc(wedgie.wedgieDate),
      columns: { wedgieDate: true, playerName: true },
    });

    const gamesSinceLastWedgie = lastWedgie
      ? await db
          .select({ count: count() })
          .from(game)
          .where(
            and(
              gt(game.createdAt, lastWedgie.wedgieDate),
              eq(game.live, false),
            ),
          )
          .then((r) => r[0]?.count ?? 0)
      : 0;

    const currentSeasonWedgies = wedgies.length;

    const hideGamesSinceLastWedgie =
      currentSeasonWedgies < (globalRow?.currentTotalWedgies ?? 0);

    const seasons = await db.query.season.findMany({
      where: and(ne(season.name, "GEMS"), ne(season.name, currentSeason!)),
      with: { wedgies: true },
    });

    const seasonRates = seasons
      .map((s) => ({
        wedgies: s.wedgies.length,
        games: s.totalGames,
        rate: s.totalGames > 0 ? s.wedgies.length / s.totalGames : 0,
      }))
      .filter((s) => s.rate > 0);

    const averageSeasonRate = Math.round(
      seasonRates.reduce((acc, s) => acc + s.wedgies, 0) / seasonRates.length,
    );

    const totalSeasonsOverall = seasons.length;
    const totalWedgiesOverall = seasons.reduce(
      (acc, s) => acc + s.wedgies.length,
      0,
    );
    const totalGamesOverall = seasons.reduce((acc, s) => acc + s.totalGames, 0);
    const globalGames = globalRow?.currentTotalGames ?? 0;

    return {
      currentSeason: currentSeason ?? "2025/26",
      wedgiesThisSeason:
        currentSeasonWedgies > (globalRow?.currentTotalWedgies ?? 0)
          ? currentSeasonWedgies
          : (globalRow?.currentTotalWedgies ?? 0),
      fgaPerWedgie,
      pace: globalRow?.pace ?? 0,
      averageLastTenSeasons: averageSeasonRate,
      ...(hideGamesSinceLastWedgie ? {} : { gamesSinceLastWedgie }),
      lastWedgiePlayer: lastWedgie?.playerName ?? null,
      statsPerWedgie: {
        fga: globalRow
          ? Math.round(globalRow.currentTotalFGA / wedgiesThisSeason)
          : 0,
        possessions: globalRow
          ? Math.round(globalRow.currentTotalPoss / wedgiesThisSeason)
          : 0,
        games: globalRow
          ? Math.round(globalRow.currentTotalGames / wedgiesThisSeason)
          : 0,
        minutes: globalRow
          ? Math.round(globalRow.currentTotalMinutes / wedgiesThisSeason)
          : 0,
      },
      leaders: {
        teams: topTeams.map((t) => ({
          name: t.name,
          wedgies: t.count,
        })),
        players: topPlayers.map((p) => ({
          name: p.playerName,
          count: p.count,
        })),
      },
      totalWedgiesOverall: totalWedgiesOverall + wedgiesThisSeason,
      totalGamesOverall: totalGamesOverall + globalGames,
      totalSeasonsOverall: totalSeasonsOverall + 1,
      oldSeasonsAverage: averageSeasonRate,
    };
  },
  ["wedgie-getNerdStats"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 300 },
);

const getCachedTotalWedgies = unstable_cache(
  async () => {
    const [result] = await db
      .select({ count: count() })
      .from(wedgie)
      .where(ne(wedgie.seasonName, "GEMS"));
    return result?.count ?? 0;
  },
  ["wedgie-getTotalWedgies"],
  { tags: [CACHE_TAGS.WEDGIE_DATA], revalidate: 120 },
);

export const wedgieRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(() => getCachedAll()),

  getBySeason: publicProcedure
    .input(z.object({ season: z.string().min(1) }))
    .query(({ input }) => getCachedBySeason(input.season)),

  getByPlayer: publicProcedure
    .input(z.object({ player: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(wedgie)
        .where(eq(wedgie.playerName, input.player));
    }),

  getByType: publicProcedure
    .input(z.object({ type: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ wedgieId: wedgieToType.wedgieId })
        .from(wedgieToType)
        .innerJoin(typeTable, eq(wedgieToType.typeId, typeTable.id))
        .where(eq(typeTable.name, input.type));

      if (rows.length === 0) return [];

      const wedgieIds = rows.map((r) => r.wedgieId);
      return ctx.db.select().from(wedgie).where(inArray(wedgie.id, wedgieIds));
    }),

  getLatest: publicProcedure.query(() => getCachedLatest()),

  create: protectedProcedure
    .input(wedgieInput)
    .mutation(async ({ ctx, input }) => {
      const { types: typeNames, ...data } = input;

      const [created] = await ctx.db
        .insert(wedgie)
        .values({
          ...data,
          position: data.position ?? { x: 0, y: 0 },
          wedgieDate: data.wedgieDate.toISOString(),
        })
        .returning();

      if (created) {
        await syncWedgieTypes(ctx.db, created.id, typeNames);
      }

      await maybeUpdateGlobalWedgieCount(ctx.db, input.seasonName);

      invalidateWedgieData();
      invalidateStoreData();

      return created;
    }),

  getSelfHostedVideos: publicProcedure.query(async ({ ctx }) => {
    const wedgies = await ctx.db
      .select({
        id: wedgie.id,
        wedgieDate: wedgie.wedgieDate,
        videoUrl: wedgie.videoUrl,
        playerName: wedgie.playerName,
        teamName: wedgie.teamName,
        teamAgainstName: wedgie.teamAgainstName,
        number: wedgie.number,
        seasonName: wedgie.seasonName,
      })
      .from(wedgie)
      .where(
        and(
          sql`json_extract(${wedgie.videoUrl}, '$.selfHosted') IS NOT NULL`,
          ne(wedgie.seasonName, "GEMS"),
        ),
      );

    return wedgies
      .filter((w) => !(w.videoUrl as VideoUrls)?.youtube)
      .sort(
        (a, b) =>
          new Date(b.wedgieDate).getTime() - new Date(a.wedgieDate).getTime(),
      );
  }),

  getLatestWedgies: publicProcedure.query(() => getCachedLatestWedgies()),

  getStats: publicProcedure.query(() => getCachedStats()),

  getCloudinaryWedgies: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: wedgie.id,
        playerName: wedgie.playerName,
        teamName: wedgie.teamName,
        teamAgainstName: wedgie.teamAgainstName,
        number: wedgie.number,
        seasonName: wedgie.seasonName,
        videoUrl: wedgie.videoUrl,
      })
      .from(wedgie)
      .where(sql`json_extract(${wedgie.videoUrl}, '$.cloudinary') IS NOT NULL`)
      .orderBy(desc(wedgie.wedgieDate));
  }),

  getTopStandings: publicProcedure.query(() => getCachedTopStandings()),

  getSeasonStandings: publicProcedure
    .input(
      z.object({
        season: z.string(),
        includeOpponents: z.boolean().default(true),
      }),
    )
    .query(({ input }) =>
      getCachedSeasonStandings(input.season, input.includeOpponents),
    ),

  getNerdStats: publicProcedure.query(() => getCachedNerdStats()),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const w = await ctx.db.query.wedgie.findFirst({
        where: eq(wedgie.id, Number(input.id)),
      });
      if (!w) return null;

      const typesMap = await getWedgiesWithTypes([w]);
      return { ...w, types: typesMap.get(w.id) ?? [] };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: wedgieInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { types: typeNames, ...data } = input.data;

      const [updated] = await ctx.db
        .update(wedgie)
        .set({
          ...data,
          position: data.position ?? { x: 0, y: 0 },
          wedgieDate: data.wedgieDate.toISOString(),
        })
        .where(eq(wedgie.id, input.id))
        .returning();

      if (updated) {
        await syncWedgieTypes(ctx.db, updated.id, typeNames);
      }

      await maybeUpdateGlobalWedgieCount(ctx.db, input.data.seasonName);

      invalidateWedgieData();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .delete(wedgie)
        .where(eq(wedgie.id, Number(input.id)))
        .returning();
      invalidateWedgieData();
      invalidateStoreData();
      return result;
    }),

  getTotalWedgies: publicProcedure.query(() => getCachedTotalWedgies()),
});
