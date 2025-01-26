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
      className={`flex w-full items-start justify-between rounded-xl bg-pink-darker/10 p-4 ${
        isLoading ? "opacity-20" : ""
      }`}
    >
      <div className="flex w-full flex-col items-start gap-4 md:flex-row md:gap-8">
        <span className="mt-0 flex items-center gap-1 text-xs font-bold tracking-wide text-yellow md:mt-2.5">
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
          <div className="relative rounded-md bg-yellow-darker/20 p-2">
            <button
              className={`flex items-center gap-2 rounded-md px-0 py-0 text-sm font-bold uppercase text-yellow`}
            >
              <span>Season</span>
              <span
                className={`relative flex h-5 w-5 items-center justify-center rounded-full border-[1px] border-yellow leading-none`}
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  +
                </span>
              </span>
            </button>
            <span className="mt-2 inline-block rounded-md bg-yellow px-2 py-1 font-bold text-darkpurple">
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
          <div className="relative rounded-md bg-yellow-darker/20 p-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold uppercase text-yellow">
                Team Counting
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <div className="flex items-center gap-2">
                  <span className="relative">
                    <input
                      type="checkbox"
                      checked={includeOpponents}
                      onChange={(e) => setIncludeOpponents(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-darkpurple-lighter after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-pink after:transition-all after:content-[''] peer-checked:bg-darkpurple-lighter peer-checked:after:translate-x-full peer-checked:after:bg-yellow"></div>
                  </span>
                  <span>
                    <span className="block w-16 text-[10px] font-medium uppercase text-white">
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
