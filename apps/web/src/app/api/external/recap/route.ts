import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { gameTimeline } from "@wedgietracker/core/utils/gameMoment";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { asc, count, eq, isNotNull, like, ne, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { game, global, season, wedgie } from "@wedgietracker/core/schema";
import {
  firstForTeam,
  leagueGap,
  nightFacts,
  previousWedgie,
  seasonPace,
  wedgieFacts,
  type GameNight,
  type PastWedgie,
} from "./facts";
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

  const [rows, globalRow, past, openings, seasons] = await Promise.all([
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
        date: sql<string>`substr(${game.createdAt}, 1, 10)`,
        games: count(),
      })
      .from(game)
      .where(isNotNull(game.seasonName))
      .groupBy(game.seasonName, sql`substr(${game.createdAt}, 1, 10)`),
    db
      .select({ name: season.name, totalGames: season.totalGames })
      .from(season)
      .where(ne(season.name, "GEMS")),
  ]);

  const history: PastWedgie[] = past;
  const nights: GameNight[] = openings.flatMap((o) =>
    o.seasonName && o.seasonName !== "GEMS" && o.date
      ? [{ seasonName: o.seasonName, date: o.date, games: o.games }]
      : [],
  );
  // a season's opening night is its first night with games
  const openingNights: Record<string, string> = {};
  for (const n of nights) {
    const first = openingNights[n.seasonName];
    if (!first || n.date < first) openingNights[n.seasonName] = n.date;
  }
  const tonight = rows.filter((w) => w.seasonName !== "GEMS");

  const seasonName = globalRow?.currentSeason.name ?? null;
  const [seasonCount] = seasonName
    ? await db
        .select({ wedgies: count() })
        .from(wedgie)
        .where(eq(wedgie.seasonName, seasonName))
    : [];

  // the night's own season, so an older date compares against its own last season
  const nightSeason = tonight[0]?.seasonName ?? seasonName;
  const night = nightSeason
    ? seasonPace(
        date,
        nightSeason,
        history,
        nights,
        Object.fromEntries(seasons.map((s) => [s.name, s.totalGames])),
      )
    : null;

  return NextResponse.json({
    date,
    facts: [
      ...nightFacts(date, tonight.length, history),
      ...(tonight.length > 0 && night?.fact ? [night.fact] : []),
    ],
    // this season after the night, next to the completed seasons' average at the same games
    pace: night?.pace ?? null,
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
      moment: gameTimeline({
        ...w,
        types: w.wedgieToTypes.map((t) => t.type),
      }),
      facts:
        w.seasonName === "GEMS"
          ? []
          : wedgieFacts(
              { ...w, date: w.wedgieDate.slice(0, 10) },
              history,
              openingNights,
              nights,
            ),
      // the player's wedgie before this one, so the recap can say how long it has been
      previous: (() => {
        if (w.seasonName === "GEMS") return null;
        const p = previousWedgie(
          { ...w, date: w.wedgieDate.slice(0, 10) },
          history,
        );
        return p ? { date: p.date, seasonName: p.seasonName } : null;
      })(),
      // time since anyone's previous wedgie, in days and games played between
      leagueGap: (() => {
        if (w.seasonName === "GEMS") return null;
        const g = leagueGap(
          { ...w, date: w.wedgieDate.slice(0, 10) },
          history,
          nights,
        );
        return g ? { days: g.days, games: g.games } : null;
      })(),
      firstForTeam:
        w.seasonName !== "GEMS" &&
        firstForTeam({ ...w, date: w.wedgieDate.slice(0, 10) }, history),
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
