"use client";

import Link from "next/link";
import { Wave } from "./Wave";
import { PaceGauge } from "./PaceGauge";
import { DaysCalendar } from "./DaysCalendar";

/**
 * What the hero shows while the stats load. It is built from the same layout
 * and the same pieces as Stats (the number box, the pace gauge, the
 * calendar), faded with their figures hidden, so when the real stats arrive
 * nothing changes size and the page doesn't jump.
 */
export function StatsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="md-min-h-[auto] relative flex min-h-[80svh] w-full flex-col md:sticky md:top-20 md:max-h-[calc(100svh-80px)] md:w-2/5 lg:w-1/2"
    >
      <div className="bg-badge grain relative flex min-h-[25em] flex-2 flex-col justify-center overflow-hidden p-8 md:min-h-[24em] md:flex-[1.6]">
        <Wave fillPercentage={0} />

        <div className="bg-panel/50 relative z-10 mx-auto w-[clamp(16rem,_13rem_+_16vw,_28rem)] rounded-lg p-4 text-center md:w-[90%] lg:w-[65%] lg:max-w-120 lg:min-w-[24rem]">
          <div className="text-cream mb-[0.15em] text-sm leading-none font-bold md:text-base">
            WE&apos;RE AT
          </div>
          <div
            aria-hidden="true"
            className="text-big-number-mobile md:text-big-number-medium lg:text-big-number text-cream/15 leading-[0.88] font-black whitespace-nowrap"
          >
            00
          </div>
          <div className="text-wedgies-text-mobile text-cream md:text-wedgies-text lg:text-wedgies-text text-shadow-badge mt-[0.08em] leading-none font-black">
            WEDGIES
          </div>
        </div>
      </div>

      <div className="bg-night relative flex min-h-[12em] flex-1 flex-col justify-center px-[18px] pt-12 pb-8 md:min-h-[17em] md:px-16 md:pt-14 md:pb-10">
        <div
          aria-hidden="true"
          className="pointer-events-none mx-auto grid w-full max-w-[560px] grid-cols-[1.35fr_1fr] items-center gap-3 opacity-40 md:grid-cols-[300px_auto] md:justify-center md:gap-12 [&_button]:text-transparent [&_span]:text-transparent [&_text]:fill-transparent"
        >
          <PaceGauge pace={0} record={1} recordSeason={null} />
          <div className="flex justify-center">
            <DaysCalendar days={1} />
          </div>
        </div>
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
