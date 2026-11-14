"use client";

import {
  MOMENT_FILTERS,
  matchesFilter,
} from "@wedgietracker/core/utils/wedgieFilter";
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
  type: { label: "Type", any: "Any type" },
  moment: { label: "When", any: "Anytime" },
};

/** A small cut gem, marking GEMS (wedgies that sit outside the seasons). */
function GemIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
      <path d="M3 1.5h6L11 4.5 6 10.5 1 4.5z" fill="#9be7ff" />
      <path
        d="M1 4.5h10M4.2 1.5 6 4.5l1.8-3M6 4.5v6"
        stroke="rgb(20 10 46 / 0.35)"
        strokeWidth=".7"
        fill="none"
      />
    </svg>
  );
}

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

  const row = (
    kind: Kind,
    value: string,
    label: string,
    count: number,
    max: number,
  ) => {
    const on = filters[kind] === value;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={on}
        onClick={() => set(kind, value)}
        className={`focus-visible:outline-cream grid min-h-10 w-full grid-cols-[7.5rem_1fr_30px_14px] items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm font-extrabold transition-colors focus-visible:outline-2 ${
          on
            ? "bg-cream text-night"
            : `text-cream/85 hover:bg-violet/15 ${count ? "" : "opacity-40"}`
        }`}
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {value === "GEMS" && <GemIcon />}
          {label}
        </span>
        <span
          aria-hidden="true"
          className={`h-1.5 ${value ? "" : "invisible"} overflow-hidden rounded-full ${on ? "bg-night/15" : "bg-violet/20"}`}
        >
          <span
            className={`block h-full rounded-full ${on ? "bg-night" : "bg-button"}`}
            style={{
              width: `${max ? Math.max(count ? 4 : 0, (count / max) * 100) : 0}%`,
            }}
          />
        </span>
        <span
          className={`text-right text-[12.5px] tabular-nums ${on ? "text-night/60" : "text-cream/55"}`}
        >
          {count}
        </span>
        <span aria-hidden="true" className="text-[13px]">
          {on ? "✓" : ""}
        </span>
      </button>
    );
  };
  const groupLabel = (text: string) => (
    <div className="text-cream/45 px-2.5 pt-2 pb-1 text-[11px] font-black tracking-[0.08em] uppercase">
      {text}
    </div>
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
        {kind === "season" && groupLabel("Seasons")}
        {regular.map((c) => row(kind, c.value, c.value, c.count, max))}
        {gems && (
          <>
            {groupLabel("Outside the seasons")}
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
                <PillLabel kind={kind}>{value || LABELS[kind].label}</PillLabel>
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
              className="bg-panel border-violet/35 scrollbar-wt absolute top-12 left-0 z-20 max-h-[min(340px,60svh)] w-full overflow-y-auto rounded-2xl border p-2 shadow-[0_14px_30px_rgb(5_2_20/0.6)] sm:w-[380px]"
            >
              {popover(open)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A pill's label. The Season pill is sized for its widest value (a season
 * like 2026/27) so it doesn't grow, and push Type and When along, when the
 * default season fills in after loading.
 */
export function PillLabel({
  kind,
  children,
}: {
  kind: string;
  children: React.ReactNode;
}) {
  if (kind !== "season") return <>{children}</>;
  return (
    <span className="inline-grid">
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        0000/00
      </span>
      <span className="[grid-area:1/1]">{children}</span>
    </span>
  );
}
