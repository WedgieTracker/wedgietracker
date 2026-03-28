"use client";

import { api } from "~/trpc/react";

interface StandingsFiltersProps {
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  includeOpponents: boolean;
  setIncludeOpponents: (value: boolean) => void;
  isLoading: boolean;
}

export function StandingsFilters({
  selectedSeason,
  setSelectedSeason,
  includeOpponents,
  setIncludeOpponents,
  isLoading,
}: StandingsFiltersProps) {
  const { data: allWedgies } = api.wedgie.getAll.useQuery();

  const seasons = Array.from(
    new Set(allWedgies?.map((w) => w.seasonName).filter(Boolean) ?? []),
  )
    .sort()
    .reverse();

  return (
    <div
      className={`bg-pink-darker/10 flex w-full items-start justify-between rounded-xl p-4 ${
        isLoading ? "opacity-20" : ""
      }`}
    >
      <div className="flex w-full flex-col items-start gap-4 md:flex-row md:gap-8">
        <span className="text-yellow mt-0 flex items-center gap-1 text-xs font-bold tracking-wide md:mt-2.5">
          FILTER BY
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 6L15 12L9 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <div className="flex gap-2">
          {/* Season Filter */}
          <div className="bg-yellow-darker/20 relative rounded-md p-2">
            <button
              className={`text-yellow flex items-center gap-2 rounded-md px-0 py-0 text-sm font-bold uppercase`}
            >
              <span>Season</span>
              <span
                className={`border-yellow relative flex h-5 w-5 items-center justify-center rounded-full border leading-none`}
              >
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  +
                </span>
              </span>
            </button>
            <span className="bg-yellow text-darkpurple mt-2 inline-block rounded-md px-2 py-1 font-bold">
              {selectedSeason || "All Seasons"}
            </span>
            <select
              className="absolute inset-0 w-full cursor-pointer opacity-0"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              <option value="">All Seasons</option>
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>

          {/* Team Count Switch */}
          <div className="bg-yellow-darker/20 relative rounded-md p-2">
            <div className="flex flex-col gap-2">
              <span className="text-yellow text-sm font-bold uppercase">
                Team Counting
              </span>
              <label
                htmlFor="teamCountingToggle"
                className="relative inline-flex cursor-pointer items-center"
              >
                <span className="sr-only">Toggle team counting</span>
                <div className="flex items-center gap-2">
                  <span className="relative">
                    <input
                      id="teamCountingToggle"
                      type="checkbox"
                      checked={includeOpponents}
                      onChange={(e) => setIncludeOpponents(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer bg-darkpurple-lighter after:bg-pink peer-checked:bg-darkpurple-lighter peer-checked:after:bg-yellow h-6 w-11 rounded-full after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </span>
                  <span>
                    <span className="block w-16 text-[10px] font-medium text-white uppercase">
                      {includeOpponents
                        ? "Including Opponents"
                        : "Player's Team Only"}
                    </span>
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
