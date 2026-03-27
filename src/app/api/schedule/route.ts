import { db } from "~/server/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { calculatePace } from "~/utils/paceCalculator";
import { CACHE_TAGS } from "~/server/cache";
import { global, season, game } from "~/server/schema";

// Add interfaces for the NBA API response
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
  games: Array<{
    gameID: string;
    gameDateTimeEst: string;
    homeTeam: string;
    awayTeam: string;
    seasonName: string;
  }>;
}

const nbaUpdate = async () => {
  try {
    // get the current values from the db
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
    const currentTotalGames = currentGlobal?.currentTotalGames ?? 0;
    const currentTotalMinutes = currentGlobal?.currentTotalMinutes ?? 0;
    const currentTotalFGA = currentGlobal?.currentTotalFGA ?? 0;
    const currentTotalPoss = currentGlobal?.currentTotalPoss ?? 0;
    let gamesPlayed = currentTotalGames;
    let minutesPlayed = currentTotalMinutes;
    let totalFGA = currentTotalFGA;
    let totalPoss = currentTotalPoss;
    const gamesToAdd: {
      gameID: string;
      gameDateTimeEst: string;
      homeTeam: string;
      awayTeam: string;
      seasonName: string;
    }[] = [];
    const gamesURLs: string[] = [];

    // Process schedule data
    for (const singleDate of scheduleLeague.leagueSchedule.gameDates) {
      const dateProcessing = new Date(singleDate.gameDate);

      if (dateProcessing.getTime() > dateStart.getTime()) {
        for (const singleGame of singleDate.games) {
          if (
            singleGame.gameStatus === 3 &&
            singleGame.weekName !== "All-Star" &&
            singleGame.gameLabel !== "Preseason"
          ) {
            const existingGame = await db.query.game.findFirst({
              where: eq(game.id, Number(singleGame.gameId)),
            });

            if (existingGame) {
              // Skip processing if game already exists
              continue;
            }

            // Ensure season exists in database
            await db
              .insert(season)
              .values({ name: seasonName })
              .onConflictDoNothing({ target: season.name });

            // Add game to both arrays since it's new
            gamesToAdd.push({
              gameID: singleGame.gameId,
              gameDateTimeEst: singleGame.gameDateTimeEst,
              homeTeam: singleGame.homeTeam.teamTricode,
              awayTeam: singleGame.awayTeam.teamTricode,
              seasonName: seasonName,
            });

            gamesURLs.push(
              `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${singleGame.gameId}.json`,
            );

            gamesPlayed++;

            // Calculate minutes played based on overtime periods
            const baseMinutes = 48;
            const otMinutes = 5;
            const gameStatus = singleGame.gameStatusText;
            const otRegex = /Final\/OT(\d*)/;
            const otMatches = otRegex.exec(gameStatus);

            if (gameStatus === "Final") {
              minutesPlayed += baseMinutes;
            } else if (otMatches) {
              const otPeriods = otMatches[1] ? parseInt(otMatches[1]) : 1;
              minutesPlayed += baseMinutes + otMinutes * otPeriods;
            }

            // Add game details if not already processed
            const gameDetail = {
              gameID: singleGame.gameId,
              gameDateTimeEst: singleGame.gameDateTimeEst,
              homeTeam: singleGame.homeTeam.teamTricode,
              awayTeam: singleGame.awayTeam.teamTricode,
              seasonName: seasonName,
            };
            gamesToAdd.push(gameDetail);
          }
        }
      }
    }

    const { fgaGame, posNumber } = await gamesFetch(gamesURLs);

    totalFGA += fgaGame;
    totalPoss += posNumber;

    // Store processed games in database
    for (const g of gamesToAdd) {
      const name = `${g.homeTeam} @ ${g.awayTeam} - ${g.gameDateTimeEst}`;

      await db
        .insert(game)
        .values({
          id: Number(g.gameID),
          name: name,
          createdAt: new Date(g.gameDateTimeEst).toISOString(),
          seasonName: g.seasonName,
        })
        .onConflictDoUpdate({
          target: game.name,
          set: { seasonName: g.seasonName },
        });
    }

    // update the total games of the current season if is different from the past total
    if (gamesPlayed !== currentGlobal?.currentTotalGames && currentGlobal?.currentSeasonId) {
      await db
        .update(season)
        .set({ totalGames: gamesPlayed })
        .where(eq(season.id, currentGlobal.currentSeasonId));
    }

    let pace: {
      simplePace: number;
      rmPace: number;
      medianPace: number;
    } = {
      simplePace: 0,
      rmPace: 0,
      medianPace: 0,
    };

    if (currentTotalWedgies) {
      // Calculate paces
      pace = await calculatePace({
        currentTotalWedgies: currentTotalWedgies,
        currentTotalGames: gamesPlayed,
      });

      // Update the final global upsert to include pace calculations
      await db
        .insert(global)
        .values({
          id: 1,
          currentSeasonId: 11,
          currentTotalFGA: totalFGA,
          currentTotalPoss: totalPoss,
          currentTotalGames: gamesPlayed,
          currentTotalMinutes: minutesPlayed,
          simplePace: pace.simplePace,
          mathPace: pace.rmPace,
          pace: pace.medianPace,
        })
        .onConflictDoUpdate({
          target: global.id,
          set: {
            currentTotalFGA: totalFGA,
            currentTotalPoss: totalPoss,
            currentTotalGames: gamesPlayed,
            currentTotalMinutes: minutesPlayed,
            simplePace: pace.simplePace,
            mathPace: pace.rmPace,
            pace: pace.medianPace,
          },
        });
    }

    revalidateTag(CACHE_TAGS.WEDGIE_DATA);

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
};

// export get and post
export const GET = nbaUpdate;
export const POST = nbaUpdate;

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
              headers: {
                Accept: "application/json",
              },
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

  return {
    fgaGame,
    posNumber,
  };
}
