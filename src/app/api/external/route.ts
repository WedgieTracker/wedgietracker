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

  // if the request has a newWedgieCount, update the global wedgie count
  if (newWedgieCount && newWedgieCount > 0) {
    const globalRow = await db.query.global.findFirst({
      where: eq(global.id, 1),
      with: { currentSeason: true },
    });

    if (!globalRow) {
      return NextResponse.json(
        { error: "Global stats not found" },
        { status: 500 },
      );
    }

    await db
      .update(global)
      .set({ currentTotalWedgies: newWedgieCount })
      .where(eq(global.id, 1));

    const pace = await calculatePace({
      currentTotalWedgies: newWedgieCount,
      currentTotalGames: globalRow.currentTotalGames,
    });

    if (!pace.medianPace) {
      return NextResponse.json({ error: "Pace update error" }, { status: 500 });
    }

    await db
      .update(global)
      .set({
        simplePace: pace.simplePace,
        mathPace: pace.rmPace,
        pace: pace.medianPace,
      })
      .where(eq(global.id, 1));
  }

  // if the request has a newTotalGamesCount, update the global total games count
  if (newTotalGamesCount && newTotalGamesCount > 0) {
    await db
      .update(global)
      .set({ currentTotalGames: newTotalGamesCount })
      .where(eq(global.id, 1));

    if (currentSeason?.currentSeasonId) {
      await db
        .update(season)
        .set({ totalGames: newTotalGamesCount })
        .where(eq(season.id, currentSeason.currentSeasonId));
    }
  }

  // if the request has a newLiveGames, update the global live games count
  if (newLiveGames || newLiveGames === false) {
    await db
      .update(global)
      .set({ liveGames: newLiveGames })
      .where(eq(global.id, 1));
  }

  // if the request has newGames array, add each game to the database
  if (newGames && newGames.length > 0) {
    // Update the type expectation to include 'live' property
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
    } else {
      console.log("No new games to create, all games already exist");
    }

    if (existingGamesToUpdate.length > 0) {
      console.log(
        `Updating live status for ${existingGamesToUpdate.length} existing games`,
      );
      for (const g of existingGamesToUpdate) {
        await db.update(game).set({ live: g.live }).where(eq(game.id, g.id));
      }
    }

    const currentTotalWedgies = await db.query.global.findFirst({
      where: eq(global.id, 1),
      columns: { currentTotalWedgies: true },
    });
    const pace = await calculatePace({
      currentTotalWedgies: currentTotalWedgies?.currentTotalWedgies ?? 0,
      currentTotalGames: newTotalGamesCount,
    });
    await db
      .update(global)
      .set({
        simplePace: pace.simplePace,
        mathPace: pace.rmPace,
        pace: pace.medianPace,
      })
      .where(eq(global.id, 1));
  }

  if (newTotalMinutes && newTotalMinutes > 0) {
    await db
      .update(global)
      .set({ currentTotalMinutes: newTotalMinutes })
      .where(eq(global.id, 1));
  }

  if (newTotalPoss) {
    await db
      .update(global)
      .set({ currentTotalPoss: newTotalPoss })
      .where(eq(global.id, 1));
  }

  if (newTotalFGA) {
    await db
      .update(global)
      .set({ currentTotalFGA: newTotalFGA })
      .where(eq(global.id, 1));
  }

  revalidateTag(CACHE_TAGS.WEDGIE_DATA);

  return NextResponse.json({ message: "Data updated successfully" });
}
