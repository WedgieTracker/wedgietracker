"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { SeasonCard } from "./SeasonCard";
import { Loader } from "~/components/shared/Loader";
import {
  FilterPill,
  OptionRow,
  POPOVER_CLASS_END,
  useCloseOnOutside,
} from "~/components/shared/FilterPopover";

type Season = {
  name: string;
  totalGames: number;
  totalWedgies: number;
};

const SORTS: { label: string; compare: (a: Season, b: Season) => number }[] = [
  { label: "Newest first", compare: (a, b) => b.name.localeCompare(a.name) },
  { label: "Oldest first", compare: (a, b) => a.name.localeCompare(b.name) },
  {
    label: "Most wedgies",
    compare: (a, b) => b.totalWedgies - a.totalWedgies,
  },
  {
    label: "Fewest wedgies",
    compare: (a, b) => a.totalWedgies - b.totalWedgies,
  },
  { label: "Most games", compare: (a, b) => b.totalGames - a.totalGames },
  { label: "Fewest games", compare: (a, b) => a.totalGames - b.totalGames },
];

/** Every season as a card, in an order the visitor can change. */
export function SeasonsHistoryContent() {
  const { data: seasons, isLoading } = api.season.getAllWithStats.useQuery();
  const [sort, setSort] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useCloseOnOutside(open, wrapRef, close);

  if (isLoading) return <LoaderWrapper />;
  if (!seasons) return null;

  // Seasons with no wedgies yet have nothing to show.
  const shown = seasons
    .filter((season) => season.totalWedgies > 0)
    .sort((a, b) => SORTS[sort]!.compare(a, b) || b.name.localeCompare(a.name));

  return (
    <div className="container mx-auto max-w-6xl">
      <div ref={wrapRef} className="relative mb-4 flex justify-end">
        <FilterPill set={sort !== 0} open={open} onClick={() => setOpen(!open)}>
          {sort === 0 ? "Sort" : SORTS[sort]!.label}
        </FilterPill>
        {open && (
          <div
            role="group"
            aria-label="Sort seasons"
            className={POPOVER_CLASS_END}
          >
            {SORTS.map((s, i) => (
              <OptionRow
                key={s.label}
                label={s.label}
                on={sort === i}
                onPick={() => {
                  setSort(i);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((season) => (
          <SeasonCard key={season.name} season={season} />
        ))}
      </div>
    </div>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex h-full min-h-svh w-full justify-center">
      <div className="items-top mr-[-30px] w-full max-w-[150px] justify-center">
        <Loader />
      </div>
    </div>
  );
};
