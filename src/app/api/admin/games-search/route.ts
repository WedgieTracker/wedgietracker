import { db } from "~/server/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team1 = searchParams.get("team1");
  const team2 = searchParams.get("team2");
  const season = searchParams.get("season");

  if (!team1 || !team2 || !season) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const games = await db.game.findMany({
      where: {
        seasonName: season,
        AND: [
          {
            name: {
              contains: team1,
            },
          },
          {
            name: {
              contains: team2,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      games: games.map((game) => ({
        ...game,
        date: game.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error searching games:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
