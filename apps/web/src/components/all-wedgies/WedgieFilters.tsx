"use client";

import {
  MOMENT_FILTERS,
  matchesFilter,
} from "@wedgietracker/core/utils/wedgieFilter";
import { api } from "~/trpc/react";
import { PageHeading } from "~/components/shared/PageHeading";
import {
  CountRow,
  FilterPill,
  GroupLabel,
  PillLabel,
  POPOVER_CLASS,
  useCloseOnOutside,
} from "~/components/shared/FilterPopover";
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

interface Filters {
  season: string;
  type: string;
  playerOrTeam: string;
  moment: string;
}

interface FiltersProps {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  visibleWedgies: number;
}

type Kind = "season" | "type" | "moment";

const LABELS: Record<Kind, { label: string; any: string }> = {
  season: { label: "Season", any: "All time" },
  type: { label: "Type", any: "Any type" },
  moment: { label: "When", any: "Anytime" },
};

/**
 * A player or team search, then Season, Type and When pills that each open a
 * popover of choices. A pill turns cream once it's set.
 */
export function WedgieFilters({
  filters,
  setFilters,
  visibleWedgies,
}: FiltersProps) {
  const { data: allWedgies, isLoading } = api.wedgie.getAll.useQuery();
  const [open, setOpen] = useState<Kind | null>(null);
  const closePopover = useCallback(() => setOpen(null), []);
  const wrapRef = useRef<HTMLDivElement>(null);

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
  const types = Array.from(
    new Set(
      allWedgies?.flatMap(
        (w) => w.types?.flatMap((t: { name: string }) => t.name || []) ?? [],
      ) ?? [],
    ),
  ).sort();
  // How many wedgies each choice would show, given the other filters as they
  // are. "" stands for the Any row.
  const countFor = (kind: Kind, value: string) =>
    allWedgies?.filter(
      (w) =>
        (kind === "season"
          ? !value || w.seasonName === value
          : !filters.season || w.seasonName === filters.season) &&
        matchesFilter(w, { ...filters, [kind]: value }),
    ).length ?? 0;
  const counted = (kind: Kind, values: string[]) =>
    values.map((value) => ({ value, count: countFor(kind, value) }));
  const choices: Record<Kind, { value: string; count: number }[]> = {
    season: counted("season", seasons),
    // Most common types first.
    type: counted("type", types).sort((a, b) => b.count - a.count),
    moment: counted("moment", [...MOMENT_FILTERS]),
  };

  useCloseOnOutside(open !== null, wrapRef, closePopover);

  const set = (kind: Kind, value: string) => {
    setFilters((prev) => ({ ...prev, [kind]: value }));
    setOpen(null);
  };
  const anySet =
    filters.season || filters.type || filters.moment || filters.playerOrTeam;

  const row = (
    kind: Kind,
    value: string,
    label: string,
    count: number,
    max: number,
  ) => (
    <CountRow
      key={label}
      value={value}
      label={label}
      count={count}
      max={max}
      on={filters[kind] === value}
      onPick={() => set(kind, value)}
    />
  );
  const popover = (kind: Kind) => {
    const list = choices[kind];
    const regular = list.filter((c) => c.value !== "GEMS");
    const gems = list.find((c) => c.value === "GEMS");
    const max = Math.max(0, ...list.map((c) => c.count));
    return (
      <>
        {row(
          kind,
          "",
          LABELS[kind].any,
          countFor(kind, ""),
          countFor(kind, ""),
        )}
        {kind === "season" && <GroupLabel>Seasons</GroupLabel>}
        {regular.map((c) => row(kind, c.value, c.value, c.count, max))}
        {gems && (
          <>
            <GroupLabel>Outside the seasons</GroupLabel>
            {row(kind, gems.value, gems.value, gems.count, max)}
          </>
        )}
      </>
    );
  };

  return (
    <div ref={wrapRef} className="w-full">
      <PageHeading
        title="All wedgies"
        badge={
          // The total sits invisibly underneath so the chip is always as wide
          // as the biggest number it can show, and filtering never resizes it.
          <span className="inline-grid tabular-nums">
            <span aria-hidden="true" className="invisible [grid-area:1/1]">
              {allWedgies?.length ?? 0}
            </span>
            <span
              key={visibleWedgies}
              className="wt-count-pop text-center [grid-area:1/1]"
            >
              {isLoading ? "" : visibleWedgies}
            </span>
          </span>
        }
        badgeAction={
          anySet && (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  season: "",
                  type: "",
                  moment: "",
                  playerOrTeam: "",
                })
              }
              className="text-cream/70 hover:text-cream focus-visible:outline-cream absolute top-full left-1/2 mt-2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full text-xs font-extrabold whitespace-nowrap not-italic transition-colors [text-shadow:none] focus-visible:outline-2"
            >
              <svg
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="size-2"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
              Clear filters
            </button>
          )
        }
      />
      <div className={`mt-8 ${isLoading ? "opacity-40" : ""}`}>
        <label className="border-violet/40 bg-night focus-within:border-cream flex min-h-[50px] items-center gap-2.5 rounded-2xl border-2 px-3.5 transition-colors">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="text-cream/45 size-[18px] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <span className="sr-only">Player or team</span>
          <input
            type="search"
            value={filters.playerOrTeam}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, playerOrTeam: e.target.value }))
            }
            placeholder="Player or team"
            className="text-cream placeholder:text-cream/45 w-full bg-transparent text-[15px] font-bold outline-none"
          />
        </label>

        <div className="relative mt-2.5 flex flex-wrap gap-1.5">
          {(Object.keys(LABELS) as Kind[]).map((kind) => {
            const value = filters[kind];
            return (
              <FilterPill
                key={kind}
                set={!!value}
                open={open === kind}
                onClick={() => setOpen(open === kind ? null : kind)}
              >
                <PillLabel kind={kind}>{value || LABELS[kind].label}</PillLabel>
              </FilterPill>
            );
          })}
          {open && (
            <div
              role="group"
              aria-label={LABELS[open].label}
              className={POPOVER_CLASS}
            >
              {popover(open)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
