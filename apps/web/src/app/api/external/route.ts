import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { global, season } from "@wedgietracker/core/schema";
import { env } from "~/env";
import { calculatePace } from "~/server/pace";
import { invalidateWedgieData } from "~/server/cache";
import {
  incomingGamesProblem,
  syncIncomingGames,
  type IncomingGame,
} from "~/server/games";

const wedgieTrackerApiKey = env.WEDGIETRACKER_API_KEY;

async function resolveTotalWedgies(newValue: number) {
  if (newValue > 0) return newValue;
  const row = await db.query.global.findFirst({
    where: eq(global.id, 1),
    columns: { currentTotalWedgies: true },
  });
  return row?.currentTotalWedgies ?? 0;
}

async function resolveTotalGames(newValue: number) {
  if (newValue > 0) return newValue;
  const row = await db.query.global.findFirst({
    where: eq(global.id, 1),
    columns: { currentTotalGames: true },
  });
  return row?.currentTotalGames ?? 0;
}

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
    // each game may carry its NBA game id as `id` ("0022600150" or 22600150)
    // and its real tip-off as `tipUtc` ("2026-11-15T01:00:00Z")
    newGames?: IncomingGame[];
    newTotalMinutes?: number;
    newTotalPoss?: number;
    newTotalFGA?: number;
  };

  // a tipUtc that is there but isn't a date-time is refused before anything is written
  const gamesProblem = incomingGamesProblem(body.newGames);
  if (gamesProblem) {
    return NextResponse.json({ error: gamesProblem }, { status: 400 });
  }

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

  await syncIncomingGames(db, newGames);

  // Recalculate pace once games are being played, including before the
  // season's first wedgie, so a dry start lowers the projection
  const [wedgieCount, gameCount] = await Promise.all([
    resolveTotalWedgies(newWedgieCount),
    resolveTotalGames(newTotalGamesCount),
  ]);

  if (gameCount > 0) {
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

  invalidateWedgieData();

  return NextResponse.json({ message: "Data updated successfully" });
}
