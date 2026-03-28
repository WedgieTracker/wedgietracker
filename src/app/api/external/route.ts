import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import { global, season, game } from "~/server/schema";
import { env } from "~/env";
import { calculatePace } from "~/utils/paceCalculator";
import { CACHE_TAGS } from "~/server/cache";

const wedgieTrackerApiKey = env.WEDGIETRACKER_API_KEY;

export async function GET() {
  const globalRow = await db.query.global.findFirst({
    where: eq(global.id, 1),
    columns: {
      currentTotalWedgies: true,
      liveGames: true,
    },
  });
  return NextResponse.json(globalRow);
}

export async function POST(request: Request) {
  // check if the request is coming from the wedgie tracker api
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== wedgieTrackerApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // get the current season
  const currentSeason = await db.query.global.findFirst({
    where: eq(global.id, 1),
    columns: { currentSeasonId: true },
  });

  const body = (await request.json()) as {
    newWedgieCount?: number;
    newTotalGamesCount?: number;
    newLiveGames?: boolean;
    newGames?: {
      id: number;
      name: string;
      createdAt: Date;
      seasonName: string;
      live: boolean;
    }[];
    newTotalMinutes?: number;
    newTotalPoss?: number;
    newTotalFGA?: number;
  };

  const {
    newWedgieCount = 0,
    newTotalGamesCount = 0,
    newLiveGames = false,
    newGames = [],
    newTotalMinutes = 0,
    newTotalPoss = 0,
    newTotalFGA = 0,
  } = body;

  console.log("Update request from rasperry pi", body);

  // Build a single global update object to minimize DB round-trips
  const globalUpdate: Record<string, unknown> = {};

  if (newWedgieCount && newWedgieCount > 0) {
    globalUpdate.currentTotalWedgies = newWedgieCount;
  }
  if (newTotalGamesCount && newTotalGamesCount > 0) {
    globalUpdate.currentTotalGames = newTotalGamesCount;

    if (currentSeason?.currentSeasonId) {
      await db
        .update(season)
        .set({ totalGames: newTotalGamesCount })
        .where(eq(season.id, currentSeason.currentSeasonId));
    }
  }
  if (newLiveGames || newLiveGames === false) {
    globalUpdate.liveGames = newLiveGames;
  }
  if (newTotalMinutes && newTotalMinutes > 0) {
    globalUpdate.currentTotalMinutes = newTotalMinutes;
  }
  if (newTotalPoss) {
    globalUpdate.currentTotalPoss = newTotalPoss;
  }
  if (newTotalFGA) {
    globalUpdate.currentTotalFGA = newTotalFGA;
  }

  // Process new games
  if (newGames && newGames.length > 0) {
    const existingGames = await db
      .select({ id: game.id, name: game.name })
      .from(game)
      .where(inArray(game.name, newGames.map((g) => g.name)));

    const existingGamesMap = new Map(
      existingGames.map((g) => [g.name, g.id]),
    );

    const newGamesToCreate = [];
    const existingGamesToUpdate = [];

    for (const g of newGames) {
      if (existingGamesMap.has(g.name)) {
        existingGamesToUpdate.push({
          id: existingGamesMap.get(g.name)!,
          live: g.live,
        });
      } else {
        newGamesToCreate.push(g);
      }
    }

    if (newGamesToCreate.length > 0) {
      console.log(`Creating ${newGamesToCreate.length} new games`);
      await db.insert(game).values(
        newGamesToCreate.map((g) => ({
          name: g.name,
          createdAt: new Date(g.createdAt).toISOString(),
          seasonName: g.seasonName,
          live: g.live,
        })),
      );
    }

    if (existingGamesToUpdate.length > 0) {
      console.log(
        `Updating live status for ${existingGamesToUpdate.length} existing games`,
      );
      for (const g of existingGamesToUpdate) {
        await db.update(game).set({ live: g.live }).where(eq(game.id, g.id));
      }
    }
  }

  // Calculate pace if we have wedgie/game data to work with
  const wedgieCount = (newWedgieCount && newWedgieCount > 0)
    ? newWedgieCount
    : (await db.query.global.findFirst({
        where: eq(global.id, 1),
        columns: { currentTotalWedgies: true },
      }))?.currentTotalWedgies ?? 0;

  const gameCount = (newTotalGamesCount && newTotalGamesCount > 0)
    ? newTotalGamesCount
    : (await db.query.global.findFirst({
        where: eq(global.id, 1),
        columns: { currentTotalGames: true },
      }))?.currentTotalGames ?? 0;

  if (wedgieCount > 0 && gameCount > 0) {
    const pace = await calculatePace({
      currentTotalWedgies: wedgieCount,
      currentTotalGames: gameCount,
    });
    globalUpdate.simplePace = pace.simplePace;
    globalUpdate.mathPace = pace.rmPace;
    globalUpdate.pace = pace.medianPace;
  }

  // Apply all global updates in a single statement
  if (Object.keys(globalUpdate).length > 0) {
    await db.update(global).set(globalUpdate).where(eq(global.id, 1));
  }

  revalidateTag(CACHE_TAGS.WEDGIE_DATA);

  return NextResponse.json({ message: "Data updated successfully" });
}
