import { and, like, eq, desc } from "drizzle-orm";
import { db } from "~/server/db";
import { game } from "~/server/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team1 = searchParams.get("team1");
  const team2 = searchParams.get("team2");
  const seasonParam = searchParams.get("season");

  if (!team1 || !team2 || !seasonParam) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const games = await db
      .select({
        id: game.id,
        name: game.name,
        createdAt: game.createdAt,
      })
      .from(game)
      .where(
        and(
          eq(game.seasonName, seasonParam),
          like(game.name, `%${team1}%`),
          like(game.name, `%${team2}%`),
        ),
      )
      .orderBy(desc(game.createdAt));

    return NextResponse.json({
      games: games.map((g) => ({
        ...g,
        date: g.createdAt,
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
