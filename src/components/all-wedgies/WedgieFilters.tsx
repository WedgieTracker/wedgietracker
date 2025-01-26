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
        ?.flatMap((w) => w.types?.map((t) => t.name) ?? [])
        .filter(Boolean) ?? [],
    ),
  ).sort();

  // State to track if button is clicked
  const [isActive, setIsActive] = useState(false);

  return (
    <div
      className={`relative flex flex-col items-start justify-between rounded-xl bg-pink-darker/10 p-4 sm:flex-row ${
        isLoading ? "opacity-20" : ""
      }`}
    >
      <>
        <div className="flex w-full flex-col items-start gap-4 sm:max-w-[calc(100%-95px)] sm:flex-row lg:gap-8">
          <span className="mt-2.5 flex items-center gap-1 whitespace-nowrap text-xs font-bold tracking-wide text-yellow">
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
              {filters.season ? (
                <span className="mt-2 inline-block rounded-md bg-yellow px-2 py-1 font-bold text-darkpurple">
                  {filters.season}
                </span>
              ) : (
                <span className="mt-2 inline-block rounded-md bg-yellow px-2 py-1 font-bold text-darkpurple">
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
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full border-[1px] leading-none ${
                    filters.type ? "border-yellow" : "border-pink"
                  }`}
                >
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    +
                  </span>
                </span>
              </button>
              {filters.type ? (
                <span className="mt-2 inline-block whitespace-nowrap rounded-md bg-yellow px-2 py-1 font-bold text-darkpurple">
                  {filters.type}
                </span>
              ) : (
                <span className="mt-2 inline-block whitespace-nowrap rounded-md px-2 py-1 font-bold text-white/20">
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
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full border-[1px] ${
                    isActive || filters.playerOrTeam
                      ? "border-yellow"
                      : "border-pink"
                  }`}
                >
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    +
                  </span>
                </span>
              </button>
              {isActive || filters.playerOrTeam ? (
                <div className="mt-2">
                  <input
                    type="text"
                    className={`w-full rounded-md px-2 py-1 font-bold placeholder:text-darkpurple/50 focus:outline-none ${
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
                    autoFocus
                  />
                </div>
              ) : (
                <span
                  className="mt-2 inline-block whitespace-nowrap rounded-md px-2 py-1 font-bold text-white/20"
                  onClick={() => setIsActive(true)}
                >
                  All Teams/Players
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Counter */}
        <div className="absolute right-3 top-3 flex flex-col items-center sm:right-4 sm:top-[50%] sm:-translate-y-1/2">
          <span className="text-3xl font-black leading-none text-yellow sm:text-6xl">
            <Counter end={visibleWedgies} duration={200} />
          </span>
          <span className="mt-[-.5em] text-xs font-black uppercase leading-none text-pink sm:text-2xl">
            TOTAL
          </span>
        </div>
      </>
    </div>
  );
}
