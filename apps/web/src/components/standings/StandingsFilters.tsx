"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "~/trpc/react";
import {
  CountRow,
  FilterPill,
  GroupLabel,
  PillLabel,
  POPOVER_CLASS,
  useCloseOnOutside,
} from "~/components/shared/FilterPopover";

interface StandingsFiltersProps {
  selectedSeason: string;
  setSelectedSeason: (season: string) => void;
  includeOpponents: boolean;
  setIncludeOpponents: (value: boolean) => void;
  isLoading: boolean;
}

/**
 * A Season pill that opens the seasons with how many wedgies each had, as on
 * All wedgies, and a switch for counting opponents' wedgies too.
 */
export function StandingsFilters({
  selectedSeason,
  setSelectedSeason,
  includeOpponents,
  setIncludeOpponents,
  isLoading,
}: StandingsFiltersProps) {
  const { data: allWedgies } = api.wedgie.getAll.useQuery();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useCloseOnOutside(open, wrapRef, close);

  const counts = new Map<string, number>();
  for (const w of allWedgies ?? []) {
    if (w.seasonName)
      counts.set(w.seasonName, (counts.get(w.seasonName) ?? 0) + 1);
  }
  // Newest season first, GEMS on their own at the end.
  const seasons = [...counts.keys()]
    .filter((s) => s !== "GEMS")
    .sort()
    .reverse();
  const max = Math.max(0, ...counts.values());
  const pick = (value: string) => {
    setSelectedSeason(value);
    setOpen(false);
  };
  const row = (value: string, label: string, count: number) => (
    <CountRow
      key={label}
      value={value}
      label={label}
      count={count}
      max={max}
      on={selectedSeason === value}
      onPick={() => pick(value)}
    />
  );

  return (
    <div
      ref={wrapRef}
      className={`relative flex flex-wrap gap-1.5 ${isLoading ? "opacity-40" : ""}`}
    >
      <FilterPill
        set={!!selectedSeason}
        open={open}
        onClick={() => setOpen(!open)}
      >
        <PillLabel kind="season">{selectedSeason || "All time"}</PillLabel>
      </FilterPill>

      <button
        type="button"
        role="switch"
        aria-checked={includeOpponents}
        onClick={() => setIncludeOpponents(!includeOpponents)}
        title="Teams also count the other side's wedgies in their games"
        className="bg-panel border-violet/30 text-cream hover:border-cream/60 focus-visible:outline-cream inline-flex min-h-10 items-center gap-2.5 rounded-xl border pr-2 pl-3 text-[13.5px] font-extrabold transition-colors focus-visible:outline-2"
      >
        Including opponents
        <span
          aria-hidden="true"
          className={`relative h-[22px] w-9 rounded-full transition-colors ${includeOpponents ? "bg-button" : "bg-cream/20"}`}
        >
          <span
            className={`absolute top-[3px] left-[3px] size-4 rounded-full transition-transform ${
              includeOpponents ? "bg-cream translate-x-3.5" : "bg-cream/70"
            }`}
          />
        </span>
      </button>

      {open && (
        <div role="group" aria-label="Season" className={POPOVER_CLASS}>
          {row("", "All time", allWedgies?.length ?? 0)}
          <GroupLabel>Seasons</GroupLabel>
          {seasons.map((s) => row(s, s, counts.get(s) ?? 0))}
          {counts.has("GEMS") && (
            <>
              <GroupLabel>Outside the seasons</GroupLabel>
              {row("GEMS", "GEMS", counts.get("GEMS") ?? 0)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
