import { db } from "~/server/db";
import { NextResponse } from "next/server";
import { calculatePace } from "~/utils/paceCalculator";

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
    const currentGlobal = await db.global.findFirst({
      where: { id: 1 },
      select: {
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

    const currentSeason = await db.season.findFirst({
      where: { id: currentGlobal?.currentSeasonId },
      select: { name: true },
    });

    const seasonName = currentSeason?.name ?? "2024/25";

    const dateStart = new Date("2023-10-20");
    let gamesPlayed = currentGlobal?.currentTotalGames ?? 0;
    let minutesPlayed = currentGlobal?.currentTotalMinutes ?? 0;
    let totalFGA = currentGlobal?.currentTotalFGA ?? 0;
    let totalPoss = currentGlobal?.currentTotalPoss ?? 0;
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
          // console.log(singleGame.gameLabel);
          if (
            singleGame.gameStatus === 3 &&
            singleGame.weekName !== "All-Star" &&
            singleGame.gameLabel !== "Preseason"
          ) {
            const existingGame = await db.game.findFirst({
              where: { id: Number(singleGame.gameId) },
            });

            if (existingGame) {
              gamesToAdd.push({
                gameID: singleGame.gameId,
                gameDateTimeEst: singleGame.gameDateTimeEst,
                homeTeam: singleGame.homeTeam.teamTricode,
                awayTeam: singleGame.awayTeam.teamTricode,
                seasonName: seasonName,
              });
              continue;
            }

            // Ensure season exists in database
            await db.season.upsert({
              where: { name: seasonName },
              create: { name: seasonName },
              update: {},
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
    for (const game of gamesToAdd) {
      const name = `${game.homeTeam} @ ${game.awayTeam} - ${game.gameDateTimeEst}`;
      // console.log(name);
      await db.game.upsert({
        where: { name: name },
        create: {
          id: Number(game.gameID),
          name: name,
          createdAt: new Date(game.gameDateTimeEst),
          seasonName: game.seasonName,
        },
        update: {
          seasonName: game.seasonName,
        },
      });
    }

    // update the total games of the current season if is different from the past total
    if (gamesPlayed !== currentGlobal?.currentTotalGames) {
      await db.season.update({
        where: { id: currentGlobal?.currentSeasonId },
        data: { totalGames: gamesPlayed },
      });
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

      console.log(currentTotalWedgies, gamesPlayed);
      pace = await calculatePace({
        currentTotalWedgies: currentTotalWedgies,
        currentTotalGames: gamesPlayed,
      });

      // Update the final db.global.upsert to include pace calculations
      await db.global.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          currentSeasonId: 11,
          currentTotalFGA: totalFGA,
          currentTotalPoss: totalPoss,
          currentTotalGames: gamesPlayed,
          currentTotalMinutes: minutesPlayed,
          simplePace: pace.simplePace,
          mathPace: pace.rmPace,
          pace: pace.medianPace,
        },
        update: {
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
