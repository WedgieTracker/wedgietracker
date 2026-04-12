"use client";

import { useState, useEffect, useRef } from "react";
import { TypingStats } from "./TypingStats";
import Link from "next/link";
import { Cta } from "../shared/Cta";
import Confetti from "react-confetti";

const Wave = ({ fillPercentage }: { fillPercentage: number }) => {
  const [currentHeight, setCurrentHeight] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  console.log(fillPercentage);

  // Handle container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    // Create a ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    const currentContainer = containerRef.current;
    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }

    // Only show confetti after client-side rendering
    if (fillPercentage === 100) {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }

    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
      resizeObserver.disconnect();
    };
  }, [fillPercentage]);

  useEffect(() => {
    setCurrentHeight(0);
    setTimeout(() => setCurrentHeight(fillPercentage), 100);
  }, [fillPercentage]);

  return (
    <div
      ref={containerRef}
      className="bg-pink absolute bottom-0 left-0 z-0 w-full transition-all duration-1000"
      style={{ height: `${currentHeight}%` }}
    >
      <div className="absolute bottom-full left-0 z-0 h-[50px] w-full overflow-hidden transition-all duration-1000">
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
      {showConfetti && dimensions.width > 0 && dimensions.height > 0 && (
        <div className="absolute inset-0 z-2 h-full w-full">
          <Confetti
            width={dimensions.width}
            height={dimensions.height}
            numberOfPieces={150}
            gravity={0.05}
            colors={["#eaff00", "#ff03ff", "#180138", "#542299", "#efff40"]}
            drawShape={(ctx) => {
              ctx.beginPath();
              // Draw a small circle
              ctx.arc(0, 0, 4, 0, 2 * Math.PI);
              ctx.fill();
            }}
          />
        </div>
      )}
    </div>
  );
};

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
    <div className="bg-darkpurple-light relative w-full max-w-xl overflow-hidden rounded-t-3xl pt-3 pb-3">
      <Wave fillPercentage={fillPercentage} />
      <div className="bg-darkpurple-light/50 relative z-10 mx-auto max-w-[18rem] rounded-lg p-4 text-center md:w-[90%] lg:w-[65%] lg:max-w-120 lg:min-w-[24rem]">
        <div className="text-yellow text-sm leading-none font-bold md:text-base">
          {stats.wedgiesThisSeason > stats.previousRecord
            ? "NEW ALL-TIME RECORD"
            : stats.wedgiesThisSeason === stats.previousRecord
              ? "ALL-TIME RECORD TIED"
              : "WE'RE AT"}
        </div>
        <div className="text-big-number-mobile text-yellow md:text-big-number-medium lg:text-big-number leading-none font-black whitespace-nowrap">
          {displayedCount.toFixed(0).toLocaleString()}
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
  if (!stats.lastWedgiePlayer) return null;
  // if (!stats.gamesSinceLastWedgie && !stats.lastWedgiePlayer) return null;

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
  const leadingTeams = stats.leaders.teams
    .filter((team) => team.wedgies === maxWedgies)
    .map((team) => team.name);

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
