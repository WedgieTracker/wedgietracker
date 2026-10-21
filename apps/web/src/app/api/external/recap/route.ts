import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { asc, count, eq, like } from "drizzle-orm";
import { db } from "~/server/db";
import { global, wedgie } from "@wedgietracker/core/schema";
import { env } from "~/env";

// The wedgies of one night, for the morning recap email. `date` is the US Eastern game date: a
// wedgie's date is its game's tip-off in Eastern time written as if UTC (see pickGame in
// ../wedgie/route.ts), so its first ten characters are the night it happened. Same key as
// /api/external ("x-api-key").

const SITE = "https://www.wedgietracker.com";

function authorised(request: Request) {
  const given = Buffer.from(request.headers.get("x-api-key") ?? "");
  const want = Buffer.from(env.WEDGIETRACKER_API_KEY);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const [rows, globalRow] = await Promise.all([
    db.query.wedgie.findMany({
      where: like(wedgie.wedgieDate, `${date}%`),
      orderBy: [asc(wedgie.wedgieDate), asc(wedgie.number)],
      with: { wedgieToTypes: { with: { type: true } } },
    }),
    db.query.global.findFirst({
      where: eq(global.id, 1),
      with: { currentSeason: true },
    }),
  ]);

  const seasonName = globalRow?.currentSeason.name ?? null;
  const [seasonCount] = seasonName
    ? await db
        .select({ wedgies: count() })
        .from(wedgie)
        .where(eq(wedgie.seasonName, seasonName))
    : [];

  return NextResponse.json({
    date,
    wedgies: rows.map((w) => ({
      seasonName: w.seasonName,
      number: w.number,
      playerName: w.playerName,
      teamName: w.teamName,
      teamAgainstName: w.teamAgainstName,
      gameName: w.gameName,
      period: w.period,
      gameClock: w.gameClock,
      teamScore: w.teamScore,
      opponentScore: w.opponentScore,
      types: w.wedgieToTypes.map((t) => t.type.name),
      shoutouts: w.shoutouts,
      videoUrl: w.videoUrl,
      url: `${SITE}/all-wedgies?${buildAllWedgiesQuery({
        season: w.seasonName,
        wedgie: w.number,
      })}`,
    })),
    season: seasonName && {
      name: seasonName,
      wedgies: Math.max(
        seasonCount?.wedgies ?? 0,
        globalRow?.currentTotalWedgies ?? 0,
      ),
      gamesPlayed: globalRow?.currentTotalGames ?? 0,
      pace: globalRow?.pace ?? 0,
    },
  });
}
