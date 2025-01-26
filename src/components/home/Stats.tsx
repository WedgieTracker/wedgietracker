"use client";

import { useEffect, useState } from "react";
import { Loader } from "../loader";
import Link from "next/link";
import { ShareableStatsVideo } from "./ShareableStatsVideo";

interface StatsProps {
  stats: {
    totalWedgies: number;
    currentPace: number;
    lastWedgie: Date | null;
    liveGames: boolean;
  };
  isLoading?: boolean;
}

const Wave = ({ fillPercentage }: { fillPercentage: number }) => {
  const [currentHeight, setCurrentHeight] = useState(0);

  useEffect(() => {
    // Start at 0 and animate to the target fillPercentage
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

export function Stats({ stats, isLoading }: StatsProps) {
  const [displayedPace, setDisplayedPace] = useState(0);
  const [displayedTotal, setDisplayedTotal] = useState(0);

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

  useEffect(() => {
    // Reset to 0 when stats.currentPace changes
    setDisplayedPace(0);

    // Animate from 0 to target over 1 second
    const duration = 1000; // 1 second
    const steps = 60; // 60 steps (smooth animation)
    const increment = stats.currentPace / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setDisplayedPace(Math.min(current * increment, stats.currentPace));

      if (current >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [stats.currentPace]);

  useEffect(() => {
    // Reset to 0 when stats.totalWedgies changes
    setDisplayedTotal(0);

    // Animate from 0 to target over 1 second
    const duration = 1000; // 1 second
    const steps = 60; // 60 steps (smooth animation)
    const increment = stats.totalWedgies / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setDisplayedTotal(Math.min(current * increment, stats.totalWedgies));

      if (current >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [stats.totalWedgies]);

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

      <div className="relative flex min-h-[25em] flex-[2] flex-col justify-center bg-darkpurple-light p-8 md:min-h-[28em]">
        <ShareableStatsVideo stats={stats} />

        <Wave fillPercentage={fillPercentage} />

        {/* Add a red dot animated on the bottom left in case there are live games */}

        <div className="relative z-10 mx-auto rounded-lg bg-darkpurple-light/50 p-4 text-center md:w-[90%] lg:w-[65%] lg:min-w-[24rem] lg:max-w-[30rem]">
          <div className="text-sm font-bold leading-none text-yellow md:text-base">
            WE&apos;RE AT
          </div>
          <div className="whitespace-nowrap text-big-number-mobile font-black leading-none text-yellow md:text-big-number-medium lg:text-big-number">
            {displayedTotal.toFixed(0).toLocaleString()}
          </div>
          <div className="text-wedgies-text-mobile font-black leading-none text-yellow md:text-wedgies-text lg:text-wedgies-text">
            WEDGIES
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[12em] flex-1 flex-col justify-center bg-darkpurple p-8 md:min-h-[14em]">
        {stats.liveGames && (
          <div
            className="absolute bottom-2 left-4 z-10 z-50 flex flex-row items-center justify-center gap-2 rounded-full border border-red-500 bg-red-500/90 px-2 py-1 md:bottom-4 md:px-2 md:py-2"
            title="Updated every 15 minutes"
          >
            <div className="z-5 relative">
              <div className="absolute left-0 top-0 h-4 w-4 animate-ping rounded-full bg-white/50"></div>
              <div className="h-4 w-4 animate-pulse rounded-full bg-white"></div>
            </div>
            <div className="z-5 relative text-[10px] font-bold uppercase tracking-wider text-white md:text-xs">
              Live games
            </div>
          </div>
        )}
        <div className="flex flex-row items-center justify-center gap-5">
          <div className="flex w-[100px] flex-col items-center justify-center text-center md:w-[135px]">
            <div className="w-full text-pace-text-mobile font-black uppercase leading-none tracking-wider text-pink md:text-pace-text">
              Pace
            </div>
            <div className="shadow-lg-darkpurple-light mt-[-.2em] w-full text-pace-number-mobile font-black leading-none text-yellow md:text-pace-number">
              {displayedPace.toFixed(0)}
            </div>
          </div>

          {daysAgo && daysAgo > 1 ? (
            <div className="ml-2 flex w-[140px] flex-row items-center justify-center gap-3">
              <div className="pl-2 text-center uppercase">
                <div className="shadow-lg-darkpurple-light text-5xl font-black leading-none text-yellow">
                  {daysAgo}
                </div>
                <div className="mt-[-.6em] text-sm font-black leading-none text-pink">
                  days
                </div>
              </div>
              <div className="text-left font-bold uppercase leading-none tracking-wide text-white">
                Without <br /> wedgies
              </div>
            </div>
          ) : (
            <div className="ml-2 flex w-[140px] flex-col items-start justify-start">
              <div className="pl-4 text-center text-4xl uppercase">
                <div className="shadow-lg-darkpurple-light animate-color-shift font-black leading-none text-pink">
                  New
                </div>
                <div className="mt-[-.3em] animate-color-shift-delayed text-[0.8em] font-black leading-none text-yellow">
                  wedgie
                </div>
              </div>
            </div>
          )}
        </div>
        {/* cta */}
        <div className="absolute left-[50%] top-0 z-10 translate-x-[-50%] translate-y-[-50%]">
          <Link
            href="/stats-for-nerds"
            className="block min-w-48 rounded-full border-2 border-yellow bg-yellow px-8 py-1 text-center text-button-text font-bold text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow"
          >
            MORE STATS
          </Link>
        </div>
      </div>
    </div>
  );
}
