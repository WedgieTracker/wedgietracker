"use client";

import { MOMENT_FILTERS } from "@wedgietracker/core/utils/wedgieFilter";
import { api } from "~/trpc/react";
import { PageHeading } from "~/components/shared/PageHeading";
import {
  useEffect,
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
  type: { label: "Type", any: "Any" },
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
  const choices: Record<Kind, string[]> = {
    season: seasons,
    type: types,
    moment: [...MOMENT_FILTERS],
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (
        e instanceof PointerEvent &&
        wrapRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const set = (kind: Kind, value: string) => {
    setFilters((prev) => ({ ...prev, [kind]: value }));
    setOpen(null);
  };
  const anySet =
    filters.season || filters.type || filters.moment || filters.playerOrTeam;

  const chip = (kind: Kind, value: string, label: string) => (
    <button
      key={label}
      type="button"
      aria-pressed={filters[kind] === value}
      onClick={() => set(kind, value)}
      className="bg-panel border-violet/25 text-cream/75 hover:border-cream/60 aria-pressed:bg-cream aria-pressed:border-cream aria-pressed:text-night focus-visible:outline-cream min-h-[38px] rounded-full border px-[13px] text-[13.5px] font-extrabold transition-colors focus-visible:outline-2"
    >
      {label}
    </button>
  );

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
              <button
                key={kind}
                type="button"
                aria-expanded={open === kind}
                onClick={() => setOpen(open === kind ? null : kind)}
                className={`focus-visible:outline-cream inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-[13.5px] font-extrabold transition-colors focus-visible:outline-2 ${
                  value
                    ? "bg-cream border-cream text-night"
                    : "bg-panel border-violet/30 text-cream hover:border-cream/60"
                }`}
              >
                {value || LABELS[kind].label}
                <span aria-hidden="true" className="text-[11px] opacity-60">
                  ▾
                </span>
              </button>
            );
          })}
          {open && (
            <div
              role="group"
              aria-label={LABELS[open].label}
              className="bg-panel border-violet/35 absolute top-12 left-0 z-20 flex w-[min(320px,100%)] flex-wrap gap-1.5 rounded-2xl border p-3 shadow-[0_14px_30px_rgb(5_2_20/0.6)]"
            >
              {chip(open, "", LABELS[open].any)}
              {choices[open].map((v) => chip(open, v, v))}
            </div>
          )}
          {anySet && (
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
              className="text-violet hover:text-cream ml-auto self-center text-[13px] font-extrabold"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
