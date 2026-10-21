import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { gameTimeline } from "@wedgietracker/core/utils/gameMoment";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { asc, count, eq, isNotNull, like, min, ne, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { game, global, wedgie } from "@wedgietracker/core/schema";
import { nightFacts, wedgieFacts, type PastWedgie } from "./facts";
import { env } from "~/env";

// The wedgies of one night, for the morning recap email. `date` is the US Eastern game date: a
// wedgie's date is its game's tip-off in Eastern time written as if UTC (see pickGame in
// ../wedgie/route.ts), so its first ten characters are the night it happened. Same key as
// /api/external ("x-api-key"). `facts` are worked out here from the whole history so the recap's
// writer only says what is true; see ./facts.ts.

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

  const [rows, globalRow, past, openings] = await Promise.all([
    db.query.wedgie.findMany({
      where: like(wedgie.wedgieDate, `${date}%`),
      orderBy: [asc(wedgie.wedgieDate), asc(wedgie.number)],
      with: { wedgieToTypes: { with: { type: true } } },
    }),
    db.query.global.findFirst({
      where: eq(global.id, 1),
      with: { currentSeason: true },
    }),
    db
      .select({
        seasonName: wedgie.seasonName,
        number: wedgie.number,
        playerName: wedgie.playerName,
        teamName: wedgie.teamName,
        date: sql<string>`substr(${wedgie.wedgieDate}, 1, 10)`,
      })
      .from(wedgie)
      .where(ne(wedgie.seasonName, "GEMS")),
    db
      .select({
        seasonName: game.seasonName,
        date: min(sql<string>`substr(${game.createdAt}, 1, 10)`),
      })
      .from(game)
      .where(isNotNull(game.seasonName))
      .groupBy(game.seasonName),
  ]);

  const history: PastWedgie[] = past;
  const openingNights = Object.fromEntries(
    openings
      .filter((o) => o.seasonName && o.seasonName !== "GEMS" && o.date)
      .map((o) => [o.seasonName, o.date]),
  ) as Record<string, string>;
  const tonight = rows.filter((w) => w.seasonName !== "GEMS");

  const seasonName = globalRow?.currentSeason.name ?? null;
  const [seasonCount] = seasonName
    ? await db
        .select({ wedgies: count() })
        .from(wedgie)
        .where(eq(wedgie.seasonName, seasonName))
    : [];

  return NextResponse.json({
    date,
    facts: nightFacts(date, tonight.length, history),
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
      // the quarter bar and band ("Late Q4", "Clutch time") the wedgie dialog shows
      moment: gameTimeline(w),
      facts:
        w.seasonName === "GEMS"
          ? []
          : wedgieFacts(
              { ...w, date: w.wedgieDate.slice(0, 10) },
              history,
              openingNights,
            ),
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
