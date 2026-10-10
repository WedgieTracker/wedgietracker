"use client";

import {
  MOMENT_FILTERS,
  shortFilterLabel,
} from "@wedgietracker/core/utils/wedgieFilter";
import { api } from "~/trpc/react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Counter } from "../ui/Counter";

interface FiltersProps {
  filters: {
    season: string;
    type: string;
    playerOrTeam: string;
    moment: string;
  };
  setFilters: Dispatch<SetStateAction<FiltersProps["filters"]>>;
  visibleWedgies: number;
}

/** Short on phones, where three filters share a row; full from sm up. */
function FilterValue({
  kind,
  value,
  full,
}: {
  kind: "season" | "type" | "when";
  value: string;
  full: string;
}) {
  return (
    <>
      <span className="sm:hidden">{shortFilterLabel(kind, value)}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  );
}

export function WedgieFilters({
  filters,
  setFilters,
  visibleWedgies,
}: FiltersProps) {
  // Get unique seasons and types for dropdowns
  const { data: allWedgies, isLoading } = api.wedgie.getAll.useQuery();

  const seasons = Array.from(
    new Set(
      allWedgies?.flatMap((w) => (w.seasonName ? [w.seasonName] : [])) ?? [],
    ),
  )
    .sort()
    .reverse();

  const types = Array.from(
    new Set(
      allWedgies?.flatMap(
        (w) =>
          w.types?.flatMap((t: { name: string }) => (t.name ? [t.name] : [])) ??
          [],
      ) ?? [],
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
              className="size-3"
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

          <div className="grid w-full grid-cols-3 flex-row gap-2 sm:flex">
            {/* Season Filter */}
            <div className="bg-yellow-darker/20 relative rounded-md p-2">
              <button
                className={`text-yellow flex items-center gap-1 rounded-md px-0 py-0 text-xs font-bold uppercase sm:gap-2 sm:text-sm`}
              >
                <span>Season</span>
                <span
                  className={`border-yellow relative flex size-4 items-center justify-center rounded-full border text-xs leading-none sm:size-5 sm:text-base`}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    +
                  </span>
                </span>
              </button>
              {filters.season ? (
                <span className="bg-yellow text-darkpurple mt-2 inline-block max-w-full rounded-md px-1.5 py-1 text-sm font-bold whitespace-nowrap sm:px-2 sm:text-base">
                  <FilterValue
                    kind="season"
                    value={filters.season}
                    full={filters.season}
                  />
                </span>
              ) : (
                <span className="bg-yellow text-darkpurple mt-2 inline-block max-w-full rounded-md px-1.5 py-1 text-sm font-bold whitespace-nowrap sm:px-2 sm:text-base">
                  <FilterValue kind="season" value="" full="All Seasons" />
                </span>
              )}
              {/* Keep existing select but make it absolute/hidden */}
              <select
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                value={filters.season}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, season: e.target.value }))
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
                className={`flex items-center gap-1 rounded-md px-0 py-0 text-xs font-bold uppercase sm:gap-2 sm:text-sm ${
                  filters.type ? "text-yellow" : "text-pink"
                }`}
              >
                <span>Type</span>
                <span
                  className={`relative flex size-4 items-center justify-center rounded-full border text-xs leading-none sm:size-5 sm:text-base ${
                    filters.type ? "border-yellow" : "border-pink"
                  }`}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    +
                  </span>
                </span>
              </button>
              {filters.type ? (
                <span className="bg-yellow text-darkpurple mt-2 inline-block max-w-full rounded-md px-1.5 py-1 text-sm font-bold whitespace-nowrap sm:px-2 sm:text-base">
                  <FilterValue
                    kind="type"
                    value={filters.type}
                    full={filters.type}
                  />
                </span>
              ) : (
                <span className="mt-2 inline-block max-w-full truncate rounded-md px-1.5 py-1 text-sm font-bold text-white/20 sm:px-2 sm:text-base">
                  <FilterValue kind="type" value="" full="All Types" />
                </span>
              )}
              <select
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value }))
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

            {/* When Filter */}
            <div
              className={`relative rounded-md p-2 ${
                filters.moment ? "bg-yellow-darker/20" : "bg-pink-darker/20"
              }`}
            >
              <button
                className={`flex items-center gap-1 rounded-md px-0 py-0 text-xs font-bold uppercase sm:gap-2 sm:text-sm ${
                  filters.moment ? "text-yellow" : "text-pink"
                }`}
              >
                <span>When</span>
                <span
                  className={`relative flex size-4 items-center justify-center rounded-full border text-xs leading-none sm:size-5 sm:text-base ${
                    filters.moment ? "border-yellow" : "border-pink"
                  }`}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    +
                  </span>
                </span>
              </button>
              {filters.moment ? (
                <span className="bg-yellow text-darkpurple mt-2 inline-block max-w-full rounded-md px-1.5 py-1 text-sm font-bold whitespace-nowrap sm:px-2 sm:text-base">
                  <FilterValue
                    kind="when"
                    value={filters.moment}
                    full={filters.moment}
                  />
                </span>
              ) : (
                <span className="mt-2 inline-block max-w-full truncate rounded-md px-1.5 py-1 text-sm font-bold text-white/20 sm:px-2 sm:text-base">
                  <FilterValue kind="when" value="" full="Anytime" />
                </span>
              )}
              <select
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                value={filters.moment}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, moment: e.target.value }))
                }
              >
                <option value="">Anytime</option>
                {MOMENT_FILTERS.map((moment) => (
                  <option key={moment} value={moment}>
                    {moment}
                  </option>
                ))}
              </select>
            </div>

            {/* Combined Team/Player Filter */}
            <div
              className={`relative col-span-3 rounded-md p-2 sm:col-span-1 ${
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
                  className={`relative flex size-5 items-center justify-center rounded-full border ${
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
                      setFilters((prev) => ({
                        ...prev,
                        playerOrTeam: value,
                      }));
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
