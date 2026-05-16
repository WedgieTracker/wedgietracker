"use client";

import Link from "next/link";
import { Wave } from "./Wave";

export function StatsSkeleton() {
  return (
    <div className="md-min-h-[auto] relative flex min-h-[80svh] w-full flex-col md:sticky md:top-20 md:max-h-[calc(100svh-80px)] md:w-2/5 lg:w-1/2">
      {/* Top left section */}

      <div className="bg-darkpurple-light relative flex min-h-[25em] flex-2 flex-col justify-center p-8 md:min-h-[28em]">
        <Wave fillPercentage={0} />

        {/* Add a red dot animated on the bottom left in case there are live games */}

        <div className="bg-darkpurple-light/50 relative z-10 mx-auto rounded-lg p-4 text-center md:w-[90%] lg:w-[65%] lg:max-w-120 lg:min-w-[24rem]">
          <div className="text-yellow text-sm leading-none font-bold md:text-base">
            WE&apos;RE AT
          </div>
          <div className="text-big-number-mobile text-yellow md:text-big-number-medium lg:text-big-number leading-none font-black whitespace-nowrap">
            0
          </div>
          <div className="text-wedgies-text-mobile text-yellow md:text-wedgies-text lg:text-wedgies-text leading-none font-black">
            WEDGIE
          </div>
        </div>
      </div>

      <div className="bg-darkpurple relative flex min-h-[12em] flex-1 flex-col justify-center px-8 pt-12 pb-4 md:min-h-[14em] md:p-8">
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
