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

  const named = Array.from(
    new Set(
      allWedgies?.flatMap((w) => (w.seasonName ? [w.seasonName] : [])) ?? [],
    ),
  );
  // Newest season first, GEMS last.
  const seasons = [
    ...named
      .filter((s) => s !== "GEMS")
      .sort()
      .reverse(),
    ...(named.includes("GEMS") ? ["GEMS"] : []),
  ];
  const chips: [string, string][] = [
    ["", "All time"],
    ...seasons.map((s): [string, string] => [s, s]),
  ];

  return (
    <div className={isLoading ? "opacity-40" : undefined}>
      <div
        role="group"
        aria-label="Season"
        className="-mx-[18px] flex [scrollbar-width:none] gap-2 overflow-x-auto px-[18px] pt-0.5 pb-1.5 md:mx-0 md:flex-wrap md:px-0"
      >
        {chips.map(([value, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={selectedSeason === value}
            onClick={() => setSelectedSeason(value)}
            className="bg-panel border-violet/20 text-cream/70 aria-pressed:bg-cream aria-pressed:border-cream aria-pressed:text-night focus-visible:outline-cream min-h-10 shrink-0 rounded-full border px-[15px] text-sm font-extrabold focus-visible:outline-2"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-panel border-violet/20 mt-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 md:max-w-[520px]">
        <div>
          <div className="text-cream text-[14.5px] font-extrabold">
            Including opponents
          </div>
          <div className="text-cream/50 mt-0.5 text-[12.5px] font-bold">
            Teams also count the other side&apos;s wedgies in their games
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={includeOpponents}
          aria-label="Including opponents"
          onClick={() => setIncludeOpponents(!includeOpponents)}
          className="aria-checked:bg-button bg-cream/20 focus-visible:outline-cream relative h-[30px] w-[50px] shrink-0 rounded-full focus-visible:outline-2"
        >
          <span
            className={`bg-cream absolute top-[3px] left-[3px] size-6 rounded-full transition-transform ${
              includeOpponents ? "translate-x-5" : "bg-cream/70"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
