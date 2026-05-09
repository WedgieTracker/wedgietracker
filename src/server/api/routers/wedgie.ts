import { z } from "zod";
import { eq, desc, ne, and, count, sql, asc, gt, inArray } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

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

async function getCachedAll() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const wedgies = await db
    .select()
    .from(wedgie)
    .orderBy(desc(wedgie.createdAt));
  const typesMap = await getWedgiesWithTypes(wedgies);
  return wedgies.map((w) => ({ ...w, types: typesMap.get(w.id) ?? [] }));
}

async function getCachedBySeason(seasonName: string) {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const wedgies = await db
    .select()
    .from(wedgie)
    .where(eq(wedgie.seasonName, seasonName))
    .orderBy(desc(wedgie.number));
  const typesMap = await getWedgiesWithTypes(wedgies);
  return wedgies.map((w) => ({ ...w, types: typesMap.get(w.id) ?? [] }));
}

async function getCachedLatest() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  return db.query.wedgie.findFirst({
    orderBy: desc(wedgie.createdAt),
  });
}

async function getCachedLatestWedgies() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const wedgies = await db
    .select()
    .from(wedgie)
    .orderBy(desc(wedgie.wedgieDate))
    .limit(13);
  const typesMap = await getWedgiesWithTypes(wedgies);
  return wedgies.map((w) => ({ ...w, types: typesMap.get(w.id) ?? [] }));
}

async function getCachedStats() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const globalSettings = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });

  if (!globalSettings) {
    throw new Error("No global settings found");
  }

  const [lastWedgie, [wedgieCountResult], previousSeasonCounts] =
    await Promise.all([
      db.query.wedgie.findFirst({
        orderBy: desc(wedgie.wedgieDate),
        columns: { wedgieDate: true },
      }),
      db
        .select({ count: count() })
        .from(wedgie)
        .where(eq(wedgie.seasonName, globalSettings.currentSeason.name)),
      db
        .select({ count: count() })
        .from(wedgie)
        .where(
          and(
            ne(wedgie.seasonName, globalSettings.currentSeason.name),
            ne(wedgie.seasonName, "GEMS"),
          ),
        )
        .groupBy(wedgie.seasonName),
    ]);
  const currentSeasonWedgies = wedgieCountResult?.count ?? 0;
  const previousRecord =
    previousSeasonCounts.length > 0
      ? Math.max(...previousSeasonCounts.map((s) => s.count))
      : 0;

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
    previousRecord,
  };
}

async function getCachedTopStandings() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const currentSeasonGlobal = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });

  const currentSeason = currentSeasonGlobal?.currentSeason.name;

  const [topPlayers, wedgies] = await Promise.all([
    db
      .select({ playerName: wedgie.playerName, count: count() })
      .from(wedgie)
      .where(eq(wedgie.seasonName, currentSeason!))
      .groupBy(wedgie.playerName)
      .orderBy(desc(count()), asc(wedgie.playerName))
      .limit(5),
    db
      .select({
        teamName: wedgie.teamName,
        teamAgainstName: wedgie.teamAgainstName,
      })
      .from(wedgie)
      .where(eq(wedgie.seasonName, currentSeason!)),
  ]);

  return {
    players: topPlayers.map((p) => ({
      name: p.playerName,
      count: p.count,
    })),
    teams: buildTeamStandings(wedgies, { limit: 5 }),
    hasWedgiesThisSeason: wedgies.length > 0,
  };
}

async function getCachedSeasonStandings(
  seasonFilter: string,
  includeOpponents: boolean,
) {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const whereClause = seasonFilter
    ? eq(wedgie.seasonName, seasonFilter)
    : undefined;

  const [topPlayers, wedgies] = await Promise.all([
    db
      .select({ playerName: wedgie.playerName, count: count() })
      .from(wedgie)
      .where(whereClause)
      .groupBy(wedgie.playerName)
      .orderBy(desc(count()), asc(wedgie.playerName)),
    db
      .select({
        teamName: wedgie.teamName,
        teamAgainstName: wedgie.teamAgainstName,
      })
      .from(wedgie)
      .where(whereClause),
  ]);

  return {
    players: topPlayers.flatMap((p) =>
      p.playerName ? [{ name: p.playerName, count: p.count }] : [],
    ),
    teams: buildTeamStandings(wedgies, { includeOpponents }),
  };
}

async function getCachedNerdStats() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

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
          and(gt(game.createdAt, lastWedgie.wedgieDate), eq(game.live, false)),
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

  const seasonRates = seasons.flatMap((s) => {
    const rate = s.totalGames > 0 ? s.wedgies.length / s.totalGames : 0;
    return rate > 0
      ? [{ wedgies: s.wedgies.length, games: s.totalGames, rate }]
      : [];
  });

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

  const previousRecord =
    seasons.length > 0 ? Math.max(...seasons.map((s) => s.wedgies.length)) : 0;

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
    previousRecord,
  };
}

async function getCachedByPlayer(playerName: string) {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  return db.select().from(wedgie).where(eq(wedgie.playerName, playerName));
}

async function getCachedByType(typeName: string) {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const rows = await db
    .select({ wedgieId: wedgieToType.wedgieId })
    .from(wedgieToType)
    .innerJoin(typeTable, eq(wedgieToType.typeId, typeTable.id))
    .where(eq(typeTable.name, typeName));

  if (rows.length === 0) return [];

  const wedgieIds = rows.map((r) => r.wedgieId);
  return db.select().from(wedgie).where(inArray(wedgie.id, wedgieIds));
}

async function getCachedSelfHostedVideos() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const wedgies = await db
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
}

async function getCachedCloudinaryWedgies() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  return db
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
}

async function getCachedTotalWedgies() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const [result] = await db
    .select({ count: count() })
    .from(wedgie)
    .where(ne(wedgie.seasonName, "GEMS"));
  return result?.count ?? 0;
}

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
    .query(({ input }) => getCachedByPlayer(input.player)),

  getByType: publicProcedure
    .input(z.object({ type: z.string().min(1) }))
    .query(({ input }) => getCachedByType(input.type)),

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

  getSelfHostedVideos: publicProcedure.query(() => getCachedSelfHostedVideos()),

  getLatestWedgies: publicProcedure.query(() => getCachedLatestWedgies()),

  getStats: publicProcedure.query(() => getCachedStats()),

  getCloudinaryWedgies: publicProcedure.query(() =>
    getCachedCloudinaryWedgies(),
  ),

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
