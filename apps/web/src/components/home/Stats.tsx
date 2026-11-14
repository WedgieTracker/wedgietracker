"use client";

import { Loader } from "../shared/Loader";
import Link from "next/link";
import { ShareableStatsVideo } from "./ShareableStatsVideo";
import { Wave } from "./Wave";
import { Counter } from "../ui/Counter";
import { PaceGauge } from "./PaceGauge";
import { DaysCalendar } from "./DaysCalendar";

interface StatsProps {
  stats: {
    totalWedgies: number;
    currentPace: number;
    gamesPlayed: number;
    previousRecord: number;
    previousRecordSeason?: string | null;
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

      <div className="bg-badge grain relative flex min-h-[25em] flex-2 flex-col justify-center overflow-hidden p-8 md:min-h-[24em] md:flex-[1.6]">
        <ShareableStatsVideo stats={stats} />

        <Wave fillPercentage={fillPercentage} showConfetti />

        {/* A red animated dot when there are live games: centred below the stats on phones, bottom left from md up */}

        <div className="bg-panel/50 relative z-10 mx-auto w-[clamp(16rem,_13rem_+_16vw,_28rem)] rounded-lg p-4 text-center md:w-[90%] lg:w-[65%] lg:max-w-120 lg:min-w-[24rem]">
          <div className="text-cream mb-[0.15em] text-sm leading-none font-bold md:text-base">
            {stats.totalWedgies > stats.previousRecord
              ? "NEW ALL-TIME RECORD"
              : stats.totalWedgies === stats.previousRecord
                ? "ALL-TIME RECORD TIED"
                : "WE'RE AT"}
          </div>
          <div className="text-big-number-mobile text-cream md:text-big-number-medium lg:text-big-number text-shadow-badge leading-[0.88] font-black whitespace-nowrap">
            <Counter
              end={stats.totalWedgies}
              format={(n) => n.toLocaleString()}
            />
          </div>
          <div className="text-wedgies-text-mobile text-cream md:text-wedgies-text lg:text-wedgies-text text-shadow-badge mt-[0.08em] leading-none font-black">
            WEDGIES
          </div>
        </div>
      </div>

      <div className="bg-night relative flex min-h-[12em] flex-1 flex-col justify-center px-[18px] pt-12 pb-8 md:min-h-[17em] md:px-16 md:pt-14 md:pb-10">
        {stats.liveGames && (
          <div
            className="z-50 order-last mx-auto mt-4 flex w-fit flex-row items-center justify-center gap-2 rounded-full border border-red-500 bg-red-500/90 px-2 py-1 md:absolute md:bottom-4 md:left-4 md:order-none md:mx-0 md:mt-0 md:px-2 md:py-2"
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
        <div className="mx-auto grid w-full max-w-[560px] grid-cols-[1.35fr_1fr] items-center gap-3 md:grid-cols-[300px_auto] md:justify-center md:gap-12">
          {showPace ? (
            <PaceGauge
              pace={stats.currentPace}
              record={stats.previousRecord}
              recordSeason={stats.previousRecordSeason ?? null}
            />
          ) : (
            <div className="bg-panel border-violet/20 rounded-[20px] border px-3.5 py-5 text-center">
              <div className="text-cream text-5xl leading-none font-black italic">
                <Counter end={stats.gamesPlayed} />
              </div>
              <div className="text-cream/70 mt-2 text-[13px] font-bold">
                games played
              </div>
            </div>
          )}
          {daysAgo !== null && (
            <div className="flex justify-center">
              <DaysCalendar days={Math.max(0, daysAgo)} />
            </div>
          )}
        </div>
        {/* cta */}
        <div className="absolute top-0 left-[50%] z-10 translate-x-[-50%] translate-y-[-50%]">
          <Link
            href="/stats-for-nerds"
            className="btn-sticker btn-sticker-flat text-button-text min-h-12 min-w-48 px-8"
          >
            MORE STATS
          </Link>
        </div>
      </div>
    </div>
  );
}
