"use client";

import { useState, useEffect } from "react";
import { TypingStats } from "./TypingStats";
import Link from "next/link";
import { Cta } from "../Cta";

const Wave = ({ fillPercentage }: { fillPercentage: number }) => {
  const [currentHeight, setCurrentHeight] = useState(0);

  useEffect(() => {
    setCurrentHeight(0);
    setTimeout(() => setCurrentHeight(fillPercentage), 100);
  }, [fillPercentage]);

  return (
    <div
      className="absolute bottom-0 left-0 z-0 w-full bg-pink transition-all duration-1000"
      style={{ height: `${currentHeight}%` }}
    >
      <div className="absolute bottom-[100%] left-0 z-0 h-[50px] w-full overflow-hidden transition-all duration-1000">
        <div className="wave-container absolute bottom-0 left-0 w-full">
          <svg
            className="waves"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 24 150 28"
            preserveAspectRatio="none"
            shapeRendering="auto"
          >
            <defs>
              <path
                id="gentle-wave"
                d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
              />
            </defs>
            <g className="parallax">
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="0"
                fill="rgba(255,0,255,0.7)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="3"
                fill="rgba(255,0,255,0.5)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="5"
                fill="rgba(255,0,255,0.3)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="7"
                fill="rgb(255 0 255)"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

interface StatsForNerdsProps {
  stats: {
    currentSeason: string;
    wedgiesThisSeason: number;
    fgaPerWedgie: number;
    pace: number;
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
    <div className="flex w-full flex-col bg-darkpurple">
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
      <span className="rounded-lg bg-pink px-2 text-darkpurple">
        {stats.currentSeason}
      </span>{" "}
      SEASON
    </div>
  );
}

function WedgieCounterWrapper({ stats }: StatsForNerdsProps) {
  const [displayedCount, setDisplayedCount] = useState(0);

  useEffect(() => {
    setDisplayedCount(0);
    const duration = 1000;
    const steps = 60;
    const increment = stats.wedgiesThisSeason / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setDisplayedCount(Math.min(current * increment, stats.wedgiesThisSeason));

      if (current >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [stats.wedgiesThisSeason]);

  const fillPercentage = Math.min((stats.wedgiesThisSeason / 50) * 100, 100);

  return (
    <div className="relative w-full max-w-xl rounded-3xl bg-darkpurple-light pb-4">
      <Wave fillPercentage={fillPercentage} />
      <div className="relative z-10 mx-auto max-w-[18rem] rounded-lg bg-darkpurple-light/50 p-4 text-center md:w-[90%] lg:w-[65%] lg:min-w-[24rem] lg:max-w-[30rem]">
        <div className="text-sm font-bold leading-none text-yellow md:text-base">
          WE&apos;RE AT
        </div>
        <div className="whitespace-nowrap text-big-number-mobile font-black leading-none text-yellow md:text-big-number-medium lg:text-big-number">
          {displayedCount.toFixed(0).toLocaleString()}
        </div>
        <div className="text-wedgies-text-mobile font-black leading-none text-yellow md:text-wedgies-text lg:text-wedgies-text">
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
  return (
    <div className="flex w-full max-w-xl flex-col items-center justify-center gap-2 rounded-3xl bg-darkpurple-dark py-4 md:flex-row md:gap-5 md:py-8">
      <div className="text-center">
        <div className="w-full text-pace-text-mobile font-black uppercase leading-none tracking-wider text-pink md:text-pace-text">
          Pace
        </div>
        <div className="shadow-lg-darkpurple-light mt-[-.2em] w-full text-pace-number-mobile font-black leading-none text-yellow md:text-pace-number">
          {stats.pace.toFixed(0)}
        </div>
      </div>
      <div className="text-center text-xl font-bold text-white md:text-left">
        {stats.pace === stats.averageLastTenSeasons ? (
          <>
            WE ARE ON PACE TO MATCH
            <br />
            THE AVERAGE OF{" "}
            <span className="text-3xl font-black text-pink">
              {stats.averageLastTenSeasons}
            </span>
            <br />
            OF THE PAST{" "}
            <span className="text-3xl font-black text-pink">10 SEASONS</span>
          </>
        ) : (
          <div>
            IT IS{" "}
            <span className="font-black text-pink">
              {Math.abs(stats.pace - stats.averageLastTenSeasons)}
            </span>{" "}
            {stats.pace > stats.averageLastTenSeasons ? "MORE" : "LESS"} THAN
            <br />
            THE AVERAGE OF{" "}
            <span className="font-black text-pink">
              {stats.averageLastTenSeasons}
            </span>
            <br />
            OF THE PAST <span className="font-black text-pink">10 SEASONS</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LastWedgieWrapper({ stats }: StatsForNerdsProps) {
  console.log(stats);
  if (!stats.lastWedgiePlayer) return null;
  // if (!stats.gamesSinceLastWedgie && !stats.lastWedgiePlayer) return null;

  return (
    <div className="flex w-full max-w-xl flex-col items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center rounded-t-3xl bg-darkpurple-dark p-4 text-base font-bold text-white md:p-8 md:text-xl">
        <span className="mb-2 flex flex-row items-center justify-center">
          <span className="mr-2 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-yellow bg-darkpurple text-center text-xl font-black leading-none text-yellow md:h-16 md:w-16 md:text-3xl">
            {stats.gamesSinceLastWedgie}
          </span>{" "}
          GAMES PLAYED
        </span>
        SINCE THE LAST
        <br />
        <span className="text-xl font-black uppercase text-yellow md:text-3xl">
          {stats.lastWedgiePlayer}&apos;S
        </span>{" "}
        WEDGIE
      </div>
      <Link
        href={`/all-wedgies`}
        className="w-full rounded-b-3xl border-2 border-yellow bg-yellow py-1.5 text-center text-button-text font-bold text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow"
      >
        VIEW ALL WEDGIES
      </Link>
    </div>
  );
}

function LeadersWrapper({ stats }: StatsForNerdsProps) {
  // Find all teams that share the highest wedgie count
  const maxWedgies = stats.leaders.teams[0]?.wedgies ?? 0;
  const leadingTeams = stats.leaders.teams
    .filter((team) => team.wedgies === maxWedgies)
    .map((team) => team.name);

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center rounded-t-3xl bg-darkpurple-dark px-2 py-4 text-center md:p-8 md:px-4">
        <div className="mb-2 text-base font-bold text-white md:mb-4 lg:text-xl xl:text-2xl">
          {leadingTeams.length > 1 ? (
            <>
              {leadingTeams.slice(0, -1).map((team) => (
                <span key={team} className="mb-1 ml-1 inline-block xl:ml-2">
                  <span className="inline-block whitespace-nowrap rounded-lg bg-pink px-1 py-0 text-darkpurple md:px-2 md:py-0">
                    {team}
                  </span>
                </span>
              ))}{" "}
              AND{" "}
              <span className="inline-block whitespace-nowrap rounded-lg bg-pink px-1 py-0 text-darkpurple md:px-2 md:py-0">
                {leadingTeams.slice(-1)[0]}
              </span>{" "}
              ARE TIED FOR THE LEAD WITH{" "}
              <span className="text-pink">#{maxWedgies}</span> WEDGIES
            </>
          ) : (
            <>
              <span className="inline-block whitespace-nowrap rounded-lg bg-pink px-1 py-0 text-darkpurple md:px-2 md:py-0">
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
              <span className="inline-block whitespace-nowrap rounded-lg bg-pink px-1 py-0 text-darkpurple md:px-2 md:py-0">
                {p.name}
              </span>
            </span>
          ))}
        </div>
      </div>
      <Link
        href="/standings"
        className="w-full rounded-b-3xl border-2 border-yellow bg-yellow py-1.5 text-center text-button-text font-bold text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow"
      >
        SEE STANDINGS
      </Link>
    </div>
  );
}

function SeasonHistoryWrapper({ stats }: StatsForNerdsProps) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center rounded-t-3xl bg-darkpurple-dark p-4 text-center md:p-8">
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
        className="w-full rounded-b-3xl border-2 border-yellow bg-yellow py-1.5 text-center text-button-text font-bold text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow"
      >
        SEE SEASONS HISTORY
      </Link>
    </div>
  );
}
