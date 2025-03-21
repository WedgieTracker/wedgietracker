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
    // get the total games for the current season
    const global = await prisma.global.findFirst({
      where: { id: 1 },
      include: { currentSeason: true },
    });

    if (!global) {
      return NextResponse.json(
        { error: "Global stats not found" },
        { status: 500 },
      );
    }

    await prisma.global.update({
      where: { id: 1 },
      data: { currentTotalWedgies: newWedgieCount },
    });

    // update the pace
    const pace = await calculatePace({
      currentTotalWedgies: newWedgieCount,
      currentTotalGames: global.currentTotalGames,
    });

    if (!pace.medianPace) {
      return NextResponse.json({ error: "Pace update error" }, { status: 500 });
    }

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
  if (newTotalGamesCount && newTotalGamesCount > 0) {
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
  if (newGames && newGames.length > 0) {
    // Update the type expectation to include 'live' property
    const existingGames = await prisma.game.findMany({
      where: {
        name: { in: newGames.map((game) => game.name) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Create a map of existing game names to their IDs for faster lookup
    const existingGamesMap = new Map(
      existingGames.map((game) => [game.name, game.id]),
    );

    // Separate games into new ones to create and existing ones to update
    const newGamesToCreate = [];
    const existingGamesToUpdate = [];

    for (const game of newGames) {
      // Add live property to the expected game structure
      const gameWithLive = {
        ...game,
      };

      if (existingGamesMap.has(game.name)) {
        // For existing games, we'll update the live status
        existingGamesToUpdate.push({
          id: existingGamesMap.get(game.name),
          live: gameWithLive.live,
        });
      } else {
        // For new games, create them with the live status
        newGamesToCreate.push(gameWithLive);
      }
    }

    // Create new games
    if (newGamesToCreate.length > 0) {
      console.log(`Creating ${newGamesToCreate.length} new games`);
      await prisma.game.createMany({
        data: newGamesToCreate,
      });
    } else {
      console.log("No new games to create, all games already exist");
    }

    // Update existing games' live status
    if (existingGamesToUpdate.length > 0) {
      console.log(
        `Updating live status for ${existingGamesToUpdate.length} existing games`,
      );
      for (const game of existingGamesToUpdate) {
        await prisma.game.update({
          where: { id: game.id },
          data: { live: game.live },
        });
      }
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

  if (newTotalMinutes && newTotalMinutes > 0) {
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
