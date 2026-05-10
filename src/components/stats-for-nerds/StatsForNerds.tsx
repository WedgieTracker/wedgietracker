"use client";

import { TypingStats } from "./TypingStats";
import Link from "next/link";
import { Cta } from "../shared/Cta";
import { Wave } from "../home/Wave";
import { Counter } from "../ui/Counter";

interface StatsForNerdsProps {
  stats: {
    currentSeason: string;
    wedgiesThisSeason: number;
    fgaPerWedgie: number;
    pace: number;
    previousRecord: number;
    averageLastTenSeasons: number;
    gamesSinceLastWedgie?: number | undefined;
    lastWedgiePlayer: string | null;
    totalWedgiesOverall: number;
    totalGamesOverall: number;
    totalSeasonsOverall: number;
    statsPerWedgie: {
      fga: number;
      possessions: number;
      games: number;
      minutes: number;
    };
    leaders: {
      teams: {
        name: string;
        wedgies: number;
      }[];
      players: {
        name: string;
        count: number;
      }[];
    };
  };
}

export function StatsForNerds({ stats }: StatsForNerdsProps) {
  return (
    <div className="bg-darkpurple flex w-full flex-col">
      <div className="relative flex flex-col lg:flex-row">
        <div className="flex w-full flex-col items-center gap-0 p-0 text-center md:justify-center md:gap-0 md:p-8 lg:sticky lg:top-20 lg:h-[calc(100svh-80px)] lg:w-1/2 lg:flex-col lg:p-4">
          <SeasonHeaderWrapper stats={stats} />
          <WedgieCounterWrapper stats={stats} />
          <TypingStatsWrapper stats={stats.statsPerWedgie} />
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-4 px-0 py-4 md:gap-12 md:px-4 lg:w-1/2 lg:px-8 lg:py-8">
          <SeasonComparisonWrapper stats={stats} />
          <LastWedgieWrapper stats={stats} />
          <LeadersWrapper stats={stats} />
          <SeasonHistoryWrapper stats={stats} />
          <Cta
            links={[
              { title: "All wedgies", url: "/all-wedgies" },
              { title: "Standings", url: "/standings" },
              { title: "Seasons history", url: "/seasons-history" },
            ]}
            variant="small"
          />
        </div>
      </div>
    </div>
  );
}

function SeasonHeaderWrapper({ stats }: StatsForNerdsProps) {
  return (
    <div className="mb-4 text-base font-bold text-white md:text-2xl lg:mb-8">
      IN THE{" "}
      <span className="bg-pink text-darkpurple rounded-lg px-2">
        {stats.currentSeason}
      </span>{" "}
      SEASON
    </div>
  );
}

function WedgieCounterWrapper({ stats }: StatsForNerdsProps) {
  const fillPercentage = Math.min((stats.wedgiesThisSeason / 50) * 100, 100);

  return (
    <div className="bg-darkpurple-light relative w-full max-w-xl overflow-hidden rounded-t-3xl pt-3 pb-3">
      <Wave fillPercentage={fillPercentage} showConfetti />
      <div className="bg-darkpurple-light/50 relative z-10 mx-auto max-w-[18rem] rounded-lg p-4 text-center md:w-[90%] lg:w-[65%] lg:max-w-120 lg:min-w-[24rem]">
        <div className="text-yellow text-sm leading-none font-bold md:text-base">
          {stats.wedgiesThisSeason > stats.previousRecord
            ? "NEW ALL-TIME RECORD"
            : stats.wedgiesThisSeason === stats.previousRecord
              ? "ALL-TIME RECORD TIED"
              : "WE'RE AT"}
        </div>
        <div className="text-big-number-mobile text-yellow md:text-big-number-medium lg:text-big-number leading-none font-black whitespace-nowrap">
          <Counter
            end={stats.wedgiesThisSeason}
            format={(n) => n.toLocaleString()}
          />
        </div>
        <div className="text-wedgies-text-mobile text-yellow md:text-wedgies-text lg:text-wedgies-text leading-none font-black">
          WEDGIES
        </div>
      </div>
    </div>
  );
}

function TypingStatsWrapper({
  stats,
}: {
  stats: StatsForNerdsProps["stats"]["statsPerWedgie"];
}) {
  return <TypingStats stats={stats} />;
}

function SeasonComparisonWrapper({ stats }: StatsForNerdsProps) {
  const showPace = stats.pace !== stats.wedgiesThisSeason;
  const isMatchingAverage = stats.pace === stats.averageLastTenSeasons;
  const diff = Math.abs(stats.pace - stats.averageLastTenSeasons);
  const isMore = stats.pace > stats.averageLastTenSeasons;

  return (
    <div className="bg-darkpurple-dark flex w-full max-w-xl flex-col items-center justify-center gap-2 rounded-3xl py-4 md:flex-row md:gap-5 md:py-8">
      {showPace ? (
        <div className="text-center">
          <div className="text-pace-text-mobile text-pink md:text-pace-text w-full leading-none font-black tracking-wider uppercase">
            Pace
          </div>
          <div className="shadow-lg-darkpurple-light text-pace-number-mobile text-yellow md:text-pace-number mt-[-.2em] w-full leading-none font-black">
            {stats.pace.toFixed(0)}
          </div>
        </div>
      ) : (
        !isMatchingAverage && (
          <div className="text-center">
            <div className="shadow-lg-darkpurple-light text-pace-number-mobile text-yellow md:text-pace-number w-full leading-none font-black">
              {diff}
            </div>
            <div className="text-pace-text-mobile text-pink md:text-pace-text mt-[-.6em] w-full leading-none font-black tracking-wider uppercase">
              {isMore ? "More" : "Less"}
            </div>
          </div>
        )
      )}
      <div className="text-center text-xl font-bold text-white md:text-left">
        {isMatchingAverage ? (
          <>
            WE ARE ON PACE TO MATCH
            <br />
            THE AVERAGE OF{" "}
            <span className="text-pink font-black">
              {stats.averageLastTenSeasons}
            </span>
            <br />
            OF THE PAST <span className="text-pink font-black">11 SEASONS</span>
          </>
        ) : showPace ? (
          <div>
            IT IS <span className="text-pink font-black">{diff}</span>{" "}
            {isMore ? "MORE" : "LESS"} THAN
            <br />
            THE AVERAGE OF{" "}
            <span className="text-pink font-black">
              {stats.averageLastTenSeasons}
            </span>
            <br />
            OF THE PAST <span className="text-pink font-black">11 SEASONS</span>
          </div>
        ) : (
          <div>
            THAN THE AVERAGE OF{" "}
            <span className="text-pink font-black">
              {stats.averageLastTenSeasons}
            </span>
            <br />
            OF THE PAST <span className="text-pink font-black">11 SEASONS</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LastWedgieWrapper({ stats }: StatsForNerdsProps) {
  if (!stats.lastWedgiePlayer || stats.gamesSinceLastWedgie === undefined)
    return null;

  return (
    <div className="flex w-full max-w-xl flex-col items-center justify-center">
      <div className="bg-darkpurple-dark flex w-full flex-col items-center justify-center rounded-t-3xl p-4 text-base font-bold text-white md:p-8 md:text-xl">
        <span className="mb-2 flex flex-row items-center justify-center">
          <span className="border-yellow bg-darkpurple text-yellow mr-2 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 text-center text-xl leading-none font-black md:h-16 md:w-16 md:text-3xl">
            {stats.gamesSinceLastWedgie}
          </span>{" "}
          GAMES PLAYED
        </span>
        SINCE THE LAST
        <br />
        <span className="text-yellow text-xl font-black uppercase md:text-3xl">
          {stats.lastWedgiePlayer}&apos;S
        </span>{" "}
        WEDGIE
      </div>
      <Link
        href={`/all-wedgies`}
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow w-full rounded-b-3xl border-2 py-1.5 text-center font-bold transition-all duration-300"
      >
        VIEW ALL WEDGIES
      </Link>
    </div>
  );
}

function LeadersWrapper({ stats }: StatsForNerdsProps) {
  // Hide leaders content when there are 0 wedgies this season
  if (stats.wedgiesThisSeason === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center">
        <Link
          href="/standings"
          className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow w-full rounded-3xl border-2 py-1.5 text-center font-bold transition-all duration-300"
        >
          SEE STANDINGS
        </Link>
      </div>
    );
  }

  // Find all teams that share the highest wedgie count
  const maxWedgies = stats.leaders.teams[0]?.wedgies ?? 0;
  const leadingTeams = stats.leaders.teams.flatMap((team) =>
    team.wedgies === maxWedgies ? [team.name] : [],
  );

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="bg-darkpurple-dark flex w-full flex-col items-center justify-center rounded-t-3xl px-2 py-4 text-center md:p-8 md:px-4">
        <div className="mb-2 text-base font-bold text-white md:mb-4 lg:text-xl xl:text-2xl">
          {leadingTeams.length > 1 ? (
            <>
              {leadingTeams.slice(0, -1).map((team) => (
                <span key={team} className="mb-1 ml-1 inline-block xl:ml-2">
                  <span className="bg-pink text-darkpurple inline-block rounded-lg px-1 py-0 whitespace-nowrap md:px-2 md:py-0">
                    {team}
                  </span>
                </span>
              ))}{" "}
              AND{" "}
              <span className="bg-pink text-darkpurple inline-block rounded-lg px-1 py-0 whitespace-nowrap md:px-2 md:py-0">
                {leadingTeams.slice(-1)[0]}
              </span>{" "}
              ARE TIED FOR THE LEAD WITH{" "}
              <span className="text-pink">#{maxWedgies}</span> WEDGIES
            </>
          ) : (
            <>
              <span className="bg-pink text-darkpurple inline-block rounded-lg px-1 py-0 whitespace-nowrap md:px-2 md:py-0">
                {leadingTeams[0] ?? "NO TEAM"}
              </span>{" "}
              CURRENTLY LEADS THE NBA WITH{" "}
              <span className="text-pink">#{maxWedgies}</span> WEDGIES FOR THE
              SEASON
            </>
          )}
        </div>
        <div className="mb-2 text-base font-bold text-white md:mb-3 lg:text-xl xl:text-2xl">
          AND THE LEADING PLAYER{stats.leaders.players.length > 1 ? "S" : ""}{" "}
          WITH{" "}
          <span className="text-pink">
            #{stats.leaders.players[0]?.count ?? 0}
          </span>{" "}
          <span>{stats.leaders.players.length > 1 ? "ARE" : "IS"}</span>
        </div>
        <div className="text-base font-bold md:text-xl xl:text-2xl">
          {stats.leaders.players.map((p) => (
            <span key={p.name} className="mb-1 ml-1 inline-block xl:ml-2">
              <span className="bg-pink text-darkpurple inline-block rounded-lg px-1 py-0 whitespace-nowrap md:px-2 md:py-0">
                {p.name}
              </span>
            </span>
          ))}
        </div>
      </div>
      <Link
        href="/standings"
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow w-full rounded-b-3xl border-2 py-1.5 text-center font-bold transition-all duration-300"
      >
        SEE STANDINGS
      </Link>
    </div>
  );
}

function SeasonHistoryWrapper({ stats }: StatsForNerdsProps) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center justify-center">
      <div className="bg-darkpurple-dark flex w-full flex-col items-center justify-center rounded-t-3xl p-4 text-center md:p-8">
        <div className="text-xl font-bold text-white md:text-2xl">
          <span className="text-pink">{stats.totalWedgiesOverall}</span> TOTAL
          WEDGIES
          <br />
          TRACKED OVER{" "}
          <span className="text-pink">{stats.totalSeasonsOverall}</span> SEASONS
          <br />
          OR{" "}
          <span className="text-pink">
            {stats.totalGamesOverall.toLocaleString()}
          </span>{" "}
          GAMES
        </div>
      </div>
      <Link
        href="/seasons-history"
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow w-full rounded-b-3xl border-2 py-1.5 text-center font-bold transition-all duration-300"
      >
        SEE SEASONS HISTORY
      </Link>
    </div>
  );
}
