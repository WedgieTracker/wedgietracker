"use client";

import { api } from "~/trpc/react";
import { useState } from "react";
import { Counter } from "../ui/Counter";

interface FiltersProps {
  filters: {
    season: string;
    type: string;
    playerOrTeam: string;
  };
  setFilters: (filters: FiltersProps["filters"]) => void;
  visibleWedgies: number;
}

export function WedgieFilters({
  filters,
  setFilters,
  visibleWedgies,
}: FiltersProps) {
  // Get unique seasons and types for dropdowns
  const { data: allWedgies, isLoading } = api.wedgie.getAll.useQuery();

  const seasons = Array.from(
    new Set(allWedgies?.map((w) => w.seasonName).filter(Boolean) ?? []),
  )
    .sort()
    .reverse();

  const types = Array.from(
    new Set(
      allWedgies
        ?.flatMap((w) => w.types?.map((t: { name: string }) => t.name) ?? [])
        .filter(Boolean) ?? [],
    ),
  ).sort();

  // State to track if button is clicked
  const [isActive, setIsActive] = useState(false);

  return (
    <div
      className={`bg-pink-darker/10 relative flex flex-col items-start justify-between rounded-xl p-4 sm:flex-row ${
        isLoading ? "opacity-20" : ""
      }`}
    >
      <>
        <div className="flex w-full flex-col items-start gap-4 sm:max-w-[calc(100%-95px)] sm:flex-row lg:gap-8">
          <span className="text-yellow mt-2.5 flex items-center gap-1 text-xs font-bold tracking-wide whitespace-nowrap">
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

          <div className="grid w-full grid-cols-2 flex-row gap-2 sm:flex">
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
              {filters.season ? (
                <span className="bg-yellow text-darkpurple mt-2 inline-block rounded-md px-2 py-1 font-bold">
                  {filters.season}
                </span>
              ) : (
                <span className="bg-yellow text-darkpurple mt-2 inline-block rounded-md px-2 py-1 font-bold">
                  All Seasons
                </span>
              )}
              {/* Keep existing select but make it absolute/hidden */}
              <select
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                value={filters.season}
                onChange={(e) =>
                  setFilters({ ...filters, season: e.target.value })
                }
              >
                <option value="">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div
              className={`relative rounded-md p-2 ${
                filters.type ? "bg-yellow-darker/20" : "bg-pink-darker/20"
              }`}
            >
              <button
                className={`flex items-center gap-2 rounded-md px-0 py-0 text-sm font-bold uppercase ${
                  filters.type ? "text-yellow" : "text-pink"
                }`}
              >
                <span>Type</span>
                <span
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full border leading-none ${
                    filters.type ? "border-yellow" : "border-pink"
                  }`}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    +
                  </span>
                </span>
              </button>
              {filters.type ? (
                <span className="bg-yellow text-darkpurple mt-2 inline-block rounded-md px-2 py-1 font-bold whitespace-nowrap">
                  {filters.type}
                </span>
              ) : (
                <span className="mt-2 inline-block rounded-md px-2 py-1 font-bold whitespace-nowrap text-white/20">
                  All Types
                </span>
              )}
              <select
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <option value="">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Combined Team/Player Filter */}
            <div
              className={`relative col-span-2 rounded-md p-2 md:col-span-1 ${
                isActive || filters.playerOrTeam
                  ? "bg-yellow-darker/20"
                  : "bg-pink-darker/20"
              }`}
            >
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 rounded-md px-0 py-0 text-sm font-bold uppercase ${
                  isActive || filters.playerOrTeam ? "text-yellow" : "text-pink"
                }`}
              >
                <span>Team/Player</span>
                <span
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full border ${
                    isActive || filters.playerOrTeam
                      ? "border-yellow"
                      : "border-pink"
                  }`}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    +
                  </span>
                </span>
              </button>
              {isActive || filters.playerOrTeam ? (
                <div className="mt-2">
                  <input
                    type="text"
                    className={`placeholder:text-darkpurple/50 w-full rounded-md px-2 py-1 font-bold focus:outline-hidden ${
                      isActive || filters.playerOrTeam
                        ? "bg-yellow text-darkpurple"
                        : "bg-pink text-white placeholder:text-white/50"
                    }`}
                    value={filters.playerOrTeam || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({
                        ...filters,
                        playerOrTeam: value,
                      });
                    }}
                    placeholder="Search teams or players..."
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-2 inline-block rounded-md px-2 py-1 font-bold whitespace-nowrap text-white/20"
                  onClick={() => setIsActive(true)}
                >
                  All Teams/Players
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Total Counter */}
        <div className="absolute top-3 right-3 flex flex-col items-center sm:top-[50%] sm:right-4 sm:-translate-y-1/2">
          <span className="text-yellow text-3xl leading-none font-black sm:text-6xl">
            <Counter end={visibleWedgies} duration={200} />
          </span>
          <span className="text-pink mt-[-.5em] text-xs leading-none font-black uppercase sm:text-2xl">
            TOTAL
          </span>
        </div>
      </>
    </div>
  );
}
