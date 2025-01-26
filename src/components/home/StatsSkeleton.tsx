"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export function StatsSkeleton() {
  return (
    <div className="md-min-h-[auto] relative flex min-h-[80svh] w-full flex-col md:sticky md:top-20 md:max-h-[calc(100svh-80px)] md:w-2/5 lg:w-1/2">
      {/* Top left section */}

      <div className="relative flex min-h-[25em] flex-[2] flex-col justify-center bg-darkpurple-light p-8 md:min-h-[28em]">
        <Wave fillPercentage={0} />

        {/* Add a red dot animated on the bottom left in case there are live games */}

        <div className="relative z-10 mx-auto rounded-lg bg-darkpurple-light/50 p-4 text-center md:w-[90%] lg:w-[65%] lg:min-w-[24rem] lg:max-w-[30rem]">
          <div className="text-sm font-bold leading-none text-yellow md:text-base">
            WE&apos;RE AT
          </div>
          <div className="whitespace-nowrap text-big-number-mobile font-black leading-none text-yellow md:text-big-number-medium lg:text-big-number">
            0
          </div>
          <div className="text-wedgies-text-mobile font-black leading-none text-yellow md:text-wedgies-text lg:text-wedgies-text">
            WEDGIE
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[10em] flex-1 flex-col justify-center bg-darkpurple p-8 md:min-h-[14em]">
        <div className="flex flex-row items-center justify-center gap-5">
          <div className="flex w-[100px] flex-col items-center justify-center text-center md:w-[135px]">
            <div className="w-full text-pace-text-mobile font-black uppercase leading-none tracking-wider text-pink md:text-pace-text">
              Pace
            </div>
            <div className="shadow-lg-darkpurple-light mt-[-.2em] w-full text-pace-number-mobile font-black leading-none text-yellow md:text-pace-number">
              0
            </div>
          </div>

          <div className="ml-2 flex w-[140px] flex-col items-start justify-start"></div>
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
