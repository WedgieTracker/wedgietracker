import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "~/server/db";
import { global, season, game } from "~/server/schema";
import { calculatePace } from "~/server/pace";
import { CACHE_TAGS } from "~/server/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NBATeam {
  teamTricode: string;
}

interface NBAGameStatus {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  gameLabel: string;
  gameDateTimeEst: string;
  weekName: string;
  homeTeam: NBATeam;
  awayTeam: NBATeam;
}

interface NBAScheduleDate {
  gameDate: string;
  games: NBAGameStatus[];
}

interface NBAScheduleResponse {
  leagueSchedule: {
    gameDates: NBAScheduleDate[];
  };
}

interface PlayByPlayAction {
  isFieldGoal: number;
  possession: number;
}

interface PlayByPlayResponse {
  game?: {
    actions?: PlayByPlayAction[];
  };
}

interface ErrorResponse {
  error: {
    message?: string;
    stack?: string;
  };
}

interface GameDetail {
  gameID: string;
  gameDateTimeEst: string;
  homeTeam: string;
  awayTeam: string;
  seasonName: string;
}

interface SuccessResponse {
  gamesPlayed: number;
  minutesPlayed: number;
  totalFGA: number;
  totalPoss: number;
  pace: {
    simplePace: number;
    rmPace: number;
    medianPace: number;
  };
  games: GameDetail[];
}

// ─── Core NBA Update ─────────────────────────────────────────────────────────

const PRESEASON_LABEL = "Preseason";
const ALL_STAR_LABEL = "All-Star";
const FINAL_GAME_STATUS = 3;
const REGULATION_MINUTES = 48;
const OT_PERIOD_MINUTES = 5;

function isEligibleGame(g: NBAGameStatus) {
  return (
    g.gameStatus === FINAL_GAME_STATUS &&
    g.weekName !== ALL_STAR_LABEL &&
    g.gameLabel !== PRESEASON_LABEL
  );
}

function computeGameMinutes(gameStatus: string): number {
  if (gameStatus === "Final") return REGULATION_MINUTES;
  const otMatches = /Final\/OT(\d*)/.exec(gameStatus);
  if (!otMatches) return 0;
  const otPeriods = otMatches[1] ? parseInt(otMatches[1]) : 1;
  return REGULATION_MINUTES + OT_PERIOD_MINUTES * otPeriods;
}

function toGameDetail(g: NBAGameStatus, seasonName: string): GameDetail {
  return {
    gameID: g.gameId,
    gameDateTimeEst: g.gameDateTimeEst,
    homeTeam: g.homeTeam.teamTricode,
    awayTeam: g.awayTeam.teamTricode,
    seasonName,
  };
}

async function extractGamesFromSchedule(
  scheduleLeague: NBAScheduleResponse,
  dateStart: Date,
  includeExistingGames: boolean,
  seasonName: string,
) {
  const gamesToAdd: GameDetail[] = [];
  const gamesURLs: string[] = [];
  let addedGames = 0;
  let addedMinutes = 0;

  for (const singleDate of scheduleLeague.leagueSchedule.gameDates) {
    if (new Date(singleDate.gameDate).getTime() <= dateStart.getTime()) {
      continue;
    }

    for (const singleGame of singleDate.games) {
      if (!isEligibleGame(singleGame)) continue;

      const existingGame = await db.query.game.findFirst({
        where: eq(game.id, Number(singleGame.gameId)),
      });

      const detail = toGameDetail(singleGame, seasonName);

      if (existingGame) {
        if (includeExistingGames) gamesToAdd.push(detail);
        continue;
      }

      gamesURLs.push(
        `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${singleGame.gameId}.json`,
      );
      addedGames += 1;
      addedMinutes += computeGameMinutes(singleGame.gameStatusText);
      gamesToAdd.push(detail);
    }
  }

  return { gamesToAdd, gamesURLs, addedGames, addedMinutes };
}

async function upsertGames(games: GameDetail[]) {
  for (const g of games) {
    await db
      .insert(game)
      .values({
        id: Number(g.gameID),
        name: `${g.homeTeam} @ ${g.awayTeam} - ${g.gameDateTimeEst}`,
        createdAt: new Date(g.gameDateTimeEst).toISOString(),
        seasonName: g.seasonName,
      })
      .onConflictDoUpdate({
        target: game.name,
        set: { seasonName: g.seasonName },
      });
  }
}

async function upsertGlobalStats(values: {
  currentTotalFGA: number;
  currentTotalPoss: number;
  currentTotalGames: number;
  currentTotalMinutes: number;
  simplePace: number;
  mathPace: number;
  pace: number;
}) {
  await db
    .insert(global)
    .values({ id: 1, currentSeasonId: 11, ...values })
    .onConflictDoUpdate({ target: global.id, set: values });
}

/**
 * Fetches NBA schedule, processes new games, calculates stats, and updates the DB.
 *
 * @param includeExistingGames - If true, already-existing games are included in
 *   `gamesToAdd` for re-upserting (used by the /schedule/full endpoint).
 *   If false, existing games are skipped entirely (used by /schedule).
 */
export async function nbaUpdate(includeExistingGames: boolean) {
  try {
    const currentGlobal = await db.query.global.findFirst({
      where: eq(global.id, 1),
      columns: {
        currentTotalFGA: true,
        currentTotalPoss: true,
        currentTotalGames: true,
        currentTotalMinutes: true,
        currentTotalWedgies: true,
        currentSeasonId: true,
      },
    });

    const currentTotalWedgies = currentGlobal?.currentTotalWedgies ?? null;

    const response = await fetch(
      `https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_34.json`,
    );
    const scheduleLeague = (await response.json()) as NBAScheduleResponse;

    const currentSeason = currentGlobal?.currentSeasonId
      ? await db.query.season.findFirst({
          where: eq(season.id, currentGlobal.currentSeasonId),
          columns: { name: true },
        })
      : null;

    const seasonName = currentSeason?.name ?? "2025/26";
    const dateStart = new Date("2025-10-20");

    // Ensure season exists in database (once, before processing games)
    await db
      .insert(season)
      .values({ name: seasonName })
      .onConflictDoNothing({ target: season.name });

    const { gamesToAdd, gamesURLs, addedGames, addedMinutes } =
      await extractGamesFromSchedule(
        scheduleLeague,
        dateStart,
        includeExistingGames,
        seasonName,
      );

    const gamesPlayed = (currentGlobal?.currentTotalGames ?? 0) + addedGames;
    const minutesPlayed =
      (currentGlobal?.currentTotalMinutes ?? 0) + addedMinutes;

    const { fgaGame, posNumber } = await gamesFetch(gamesURLs);
    const totalFGA = (currentGlobal?.currentTotalFGA ?? 0) + fgaGame;
    const totalPoss = (currentGlobal?.currentTotalPoss ?? 0) + posNumber;

    await upsertGames(gamesToAdd);

    // Update the total games of the current season if different from the past total
    if (
      gamesPlayed !== currentGlobal?.currentTotalGames &&
      currentGlobal?.currentSeasonId
    ) {
      await db
        .update(season)
        .set({ totalGames: gamesPlayed })
        .where(eq(season.id, currentGlobal.currentSeasonId));
    }

    let pace = { simplePace: 0, rmPace: 0, medianPace: 0 };

    if (currentTotalWedgies) {
      pace = await calculatePace({
        currentTotalWedgies,
        currentTotalGames: gamesPlayed,
      });

      await upsertGlobalStats({
        currentTotalFGA: totalFGA,
        currentTotalPoss: totalPoss,
        currentTotalGames: gamesPlayed,
        currentTotalMinutes: minutesPlayed,
        simplePace: pace.simplePace,
        mathPace: pace.rmPace,
        pace: pace.medianPace,
      });
    }

    revalidateTag(CACHE_TAGS.WEDGIE_DATA, "max");

    return NextResponse.json({
      gamesPlayed,
      minutesPlayed,
      totalFGA,
      totalPoss,
      pace,
      games: gamesToAdd,
    } satisfies SuccessResponse);
  } catch (error) {
    console.error(error);
    const errorResponse: ErrorResponse = {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: "An unknown error occurred" },
    };
    return NextResponse.json(errorResponse);
  }
}

// ─── Play-by-Play Helpers ────────────────────────────────────────────────────

async function gamesFetch(gamesURLs: string[]) {
  try {
    const batchSize = 5;
    const allResponses: PlayByPlayResponse[] = [];

    for (let i = 0; i < gamesURLs.length; i += batchSize) {
      const batch = gamesURLs.slice(i, i + batchSize);
      const batchResponses = await Promise.all(
        batch.map(async (url) => {
          try {
            const response = await fetch(url, {
              headers: { Accept: "application/json" },
            });
            return (await response.json()) as PlayByPlayResponse;
          } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
          }
        }),
      );

      allResponses.push(...batchResponses.filter((r) => r !== null));

      if (i + batchSize < gamesURLs.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return await gamesProcess(allResponses);
  } catch (error) {
    console.error("Error in gamesFetch:", error);
    throw error;
  }
}

async function gamesProcess(data: PlayByPlayResponse[]) {
  let fgaGame = 0;
  let posNumber = 0;
  const processStart = Date.now();
  const timeoutLimit = 25000;

  for (const singleGame of data) {
    if (Date.now() - processStart > timeoutLimit) {
      console.warn("Processing timeout reached, returning partial results");
      break;
    }

    try {
      if (!singleGame?.game?.actions) continue;

      let possession: number | undefined;
      let previousPossession = 0;

      for (const singleAction of singleGame.game.actions) {
        previousPossession = possession ?? 0;
        possession = singleAction.possession;

        if (singleAction.isFieldGoal === 1) {
          fgaGame++;
        }
        if (previousPossession !== possession && possession !== 0) {
          posNumber++;
        }
      }
    } catch (error) {
      console.error("Error processing game:", error);
      continue;
    }
  }

  return { fgaGame, posNumber };
}
