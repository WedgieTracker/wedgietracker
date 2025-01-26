import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { env } from "~/env";
import { calculatePace } from "~/utils/paceCalculator";
const prisma = new PrismaClient();

const wedgieTrackerApiKey = env.WEDGIETRACKER_API_KEY;

export async function GET() {
  const global = await prisma.global.findFirst({
    where: {
      id: 1,
    },
    select: {
      currentTotalWedgies: true,
      liveGames: true,
    },
  });
  return NextResponse.json(global);
}

export async function POST(request: Request) {
  // check if the request is coming from the wedgie tracker api
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== wedgieTrackerApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // get the current season
  const currentSeason = await prisma.global.findFirst({
    where: {
      id: 1,
    },
    select: {
      currentSeasonId: true,
    },
  });

  // parse the request body
  const body = (await request.json()) as {
    newWedgieCount?: number;
    newTotalGamesCount?: number;
    newLiveGames?: boolean;
    newGames?: {
      id: number;
      name: string;
      createdAt: Date;
      seasonName: string;
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

  console.log("update request", body);

  // if the request has a newWedgieCount, update the global wedgie count
  if (newWedgieCount) {
    await prisma.global.update({
      where: { id: 1 },
      data: { currentTotalWedgies: newWedgieCount },
    });
    // get the total games for the current season
    const currentSeasonTotalGames = await prisma.season.findFirst({
      where: { id: currentSeason?.currentSeasonId },
      select: { totalGames: true },
    });
    // update the pace
    const pace = await calculatePace({
      currentTotalWedgies: newWedgieCount,
      currentTotalGames: currentSeasonTotalGames?.totalGames ?? 0,
    });
    await prisma.global.update({
      where: { id: 1 },
      data: {
        simplePace: pace.simplePace,
        mathPace: pace.rmPace,
        pace: pace.medianPace,
      },
    });
  }

  // if the request has a newTotalGamesCount, update the global total games count
  if (newTotalGamesCount) {
    await prisma.global.update({
      where: { id: 1 },
      data: { currentTotalGames: newTotalGamesCount },
    });
    // update the current season total games
    await prisma.season.update({
      where: { id: currentSeason?.currentSeasonId },
      data: { totalGames: newTotalGamesCount },
    });
  }

  // if the request has a newLiveGames, update the global live games count
  if (newLiveGames || newLiveGames === false) {
    await prisma.global.update({
      where: { id: 1 },
      data: { liveGames: newLiveGames },
    });
  }

  // if the request has newGames array, add each game to the database
  if (newGames) {
    // check if the game already exists
    const existingGames = await prisma.game.findMany({
      where: {
        name: { in: newGames.map((game) => game.name) },
      },
    });
    const newGamesToCreate = newGames.filter(
      (game) => !existingGames.some((g) => g.name === game.name),
    );
    if (newGamesToCreate.length > 0) {
      await prisma.game.createMany({
        data: newGamesToCreate,
      });
    }
    // update the pace
    const currentTotalWedgies = await prisma.global.findFirst({
      where: { id: 1 },
      select: { currentTotalWedgies: true },
    });
    const pace = await calculatePace({
      currentTotalWedgies: currentTotalWedgies?.currentTotalWedgies ?? 0,
      currentTotalGames: newTotalGamesCount,
    });
    await prisma.global.update({
      where: { id: 1 },
      data: {
        simplePace: pace.simplePace,
        mathPace: pace.rmPace,
        pace: pace.medianPace,
      },
    });
  }

  if (newTotalMinutes) {
    await prisma.global.update({
      where: { id: 1 },
      data: { currentTotalMinutes: newTotalMinutes },
    });
  }

  if (newTotalPoss) {
    await prisma.global.update({
      where: { id: 1 },
      data: { currentTotalPoss: newTotalPoss },
    });
  }

  if (newTotalFGA) {
    await prisma.global.update({
      where: { id: 1 },
      data: { currentTotalFGA: newTotalFGA },
    });
  }

  return NextResponse.json({ message: "Data updated successfully" });
}
