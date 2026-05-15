"use client";

import { Loader } from "../shared/Loader";
import Link from "next/link";
import { ShareableStatsVideo } from "./ShareableStatsVideo";
import { Wave } from "./Wave";
import { Counter } from "../ui/Counter";

interface StatsProps {
  stats: {
    totalWedgies: number;
    currentPace: number;
    gamesPlayed: number;
    previousRecord: number;
    lastWedgie: Date | string | null;
    liveGames: boolean;
  };
  isLoading?: boolean;
}

export function Stats({ stats, isLoading }: StatsProps) {
  // Calculate percentage of wedgies compared to target of 50
  const fillPercentage = Math.min((stats.totalWedgies / 50) * 100, 100);

  // Calculate days since last wedgie
  const getDaysAgo = () => {
    if (!stats.lastWedgie) return null;

    // Create dates in EST timezone
    const estFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const lastWedgieDate = new Date(
      estFormatter.format(new Date(stats.lastWedgie)),
    );
    const today = new Date(estFormatter.format(new Date()));

    const diffTime = Math.abs(today.getTime() - lastWedgieDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

    return diffDays;
  };

  const daysAgo = getDaysAgo();
  const showPace = stats.currentPace !== stats.totalWedgies;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="md-min-h-[auto] relative flex min-h-[80svh] w-full flex-col md:sticky md:top-20 md:max-h-[calc(100svh-80px)] md:w-2/5 lg:w-1/2">
      {/* Top left section */}

      <div className="bg-darkpurple-light relative flex min-h-[25em] flex-2 flex-col justify-center overflow-hidden p-8 md:min-h-[28em]">
        <ShareableStatsVideo stats={stats} />

        <Wave fillPercentage={fillPercentage} showConfetti />

        {/* Add a red dot animated on the bottom left in case there are live games */}

        <div className="bg-darkpurple-light/50 relative z-10 mx-auto w-[clamp(16rem,_13rem_+_16vw,_28rem)] rounded-lg p-4 text-center md:w-[90%] lg:w-[65%] lg:max-w-120 lg:min-w-[24rem]">
          <div className="text-yellow text-sm leading-none font-bold md:text-base">
            {stats.totalWedgies > stats.previousRecord
              ? "NEW ALL-TIME RECORD"
              : stats.totalWedgies === stats.previousRecord
                ? "ALL-TIME RECORD TIED"
                : "WE'RE AT"}
          </div>
          <div className="text-big-number-mobile text-yellow md:text-big-number-medium lg:text-big-number leading-none font-black whitespace-nowrap">
            <Counter
              end={stats.totalWedgies}
              format={(n) => n.toLocaleString()}
            />
          </div>
          <div className="text-wedgies-text-mobile text-yellow md:text-wedgies-text lg:text-wedgies-text leading-none font-black">
            WEDGIES
          </div>
        </div>
      </div>

      <div className="bg-darkpurple relative flex min-h-[12em] flex-1 flex-col justify-center px-8 py-12 md:min-h-[14em] md:py-8">
        {stats.liveGames && (
          <div
            className="absolute bottom-2 left-4 z-10 z-50 flex flex-row items-center justify-center gap-2 rounded-full border border-red-500 bg-red-500/90 px-2 py-1 md:bottom-4 md:px-2 md:py-2"
            title="Updated every 15 minutes"
          >
            <div className="relative z-5">
              <div className="absolute top-0 left-0 size-4 animate-ping rounded-full bg-white/50"></div>
              <div className="size-4 animate-pulse rounded-full bg-white"></div>
            </div>
            <div className="relative z-5 text-[10px] font-bold tracking-wider text-white uppercase md:text-xs">
              Live games
            </div>
          </div>
        )}
        <div
          className={`flex items-center justify-center gap-2 md:flex-row md:gap-5 ${
            showPace ? "flex-row" : "flex-col"
          }`}
        >
          <div
            className={`flex flex-col items-center justify-center text-center ${
              showPace ? "w-[100px] md:w-[135px]" : "w-auto md:w-[140px]"
            }`}
          >
            <div
              className={`text-pink w-full leading-none font-black tracking-wider uppercase ${
                showPace ? "text-pace-text-mobile md:text-pace-text" : "text-xl"
              }`}
            >
              {showPace ? "Pace" : "Games"}
            </div>
            <div
              className={`shadow-lg-darkpurple-light text-yellow mt-[-.2em] w-full leading-none font-black ${
                showPace
                  ? "text-pace-number-mobile md:text-pace-number"
                  : "text-5xl"
              }`}
            >
              <Counter end={showPace ? stats.currentPace : stats.gamesPlayed} />
            </div>
          </div>

          {daysAgo && daysAgo > 0 ? (
            <div
              className={`flex w-[140px] flex-row items-center justify-center gap-3 md:ml-2 ${
                showPace ? "ml-2" : ""
              }`}
            >
              <div
                className={`text-center uppercase md:pl-2 ${
                  showPace ? "pl-2" : ""
                }`}
              >
                <div className="shadow-lg-darkpurple-light text-yellow text-5xl leading-none font-black">
                  {daysAgo}
                </div>
                <div className="text-pink mt-[-.6em] text-sm leading-none font-black">
                  {daysAgo === 1 ? "day" : "days"}
                </div>
              </div>
              <div className="text-left leading-none font-bold tracking-wide text-white uppercase">
                Without <br /> wedgies
              </div>
            </div>
          ) : (
            <div
              className={`flex w-[140px] flex-col items-start justify-start md:ml-2 ${
                showPace ? "ml-2" : ""
              }`}
            >
              <div
                className={`text-center text-4xl uppercase md:pl-4 ${
                  showPace ? "pl-4" : ""
                }`}
              >
                <div className="shadow-lg-darkpurple-light animate-color-shift text-pink leading-none font-black">
                  New
                </div>
                <div className="animate-color-shift-delayed text-yellow mt-[-.3em] text-[0.8em] leading-none font-black">
                  wedgie
                </div>
              </div>
            </div>
          )}
        </div>
        {/* cta */}
        <div className="absolute top-0 left-[50%] z-10 translate-x-[-50%] translate-y-[-50%]">
          <Link
            href="/stats-for-nerds"
            className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow block min-w-48 rounded-full border-2 px-8 py-1 text-center font-bold transition-all duration-300"
          >
            MORE STATS
          </Link>
        </div>
      </div>
    </div>
  );
}
