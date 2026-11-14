"use client";

import Link from "next/link";
import { useState } from "react";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";
import { cn } from "~/lib/utils";

const TEAM_NAMES = new Map(TEAMS.map((t) => [t.code, t.fullName]));

interface Item {
  name: string;
  count: number;
}

/**
 * Consecutive items with the same count, numbered 1, 2, 3 by count (a tie
 * shares a number and the next count takes the next one).
 */
function groupByCount(items: Item[]) {
  const groups: { rank: number; items: Item[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.items[0]?.count === item.count) last.items.push(item);
    else groups.push({ rank: groups.length + 1, items: [item] });
  }
  return groups;
}

interface StandingsListProps {
  title?: string;
  items: Item[];
  /** Teams are stored as codes; show their full names. */
  kind?: "players" | "teams";
  buildHref: (name: string) => string;
  /** Show this many, then a button for the rest. */
  limit?: number;
  /** Show how many are listed next to the title. */
  showCount?: boolean;
  className?: string;
}

/**
 * A ranked list where a tie is one rounded bracket: the shared rank sits at
 * the top of the bracket and stays in view while a long tie scrolls past.
 */
export function StandingsList({
  title,
  items,
  kind = "players",
  buildHref,
  limit,
  showCount = true,
  className,
}: StandingsListProps) {
  const [showAll, setShowAll] = useState(false);
  const shown = limit && !showAll ? items.slice(0, limit) : items;
  const label = (name: string) =>
    kind === "teams" ? (TEAM_NAMES.get(name) ?? name) : name;

  const row = (item: Item) => (
    <Link
      href={buildHref(item.name)}
      className="text-cream hover:text-cream/80 focus-visible:outline-cream flex min-h-[50px] items-center justify-between gap-3 text-[15px] font-bold transition-colors focus-visible:outline-2"
    >
      <span className="truncate">{label(item.name)}</span>
      <span className="font-black tabular-nums">{item.count}</span>
    </Link>
  );

  return (
    <div
      className={cn(
        "bg-panel border-violet/20 rounded-[20px] border px-4 py-1",
        className,
      )}
    >
      {title && (
        <h3 className="text-cream flex items-baseline justify-between pt-4 pb-1.5 text-lg font-extrabold">
          {title}
          {showCount && (
            <small className="text-cream/50 text-[13px] font-bold">
              {items.length}
            </small>
          )}
        </h3>
      )}
      {items.length === 0 ? (
        <p className="text-cream/70 py-6 font-bold">
          No wedgies this season yet.
        </p>
      ) : (
        <ol>
          {groupByCount(shown).map(({ rank, items: group }) =>
            group.length === 1 ? (
              <li
                key={group[0]!.name}
                className="border-violet/15 grid grid-cols-[58px_1fr] items-center border-t first:border-t-0"
              >
                <span className="text-violet pt-[3px] text-lg font-black italic">
                  {rank}
                </span>
                {row(group[0]!)}
              </li>
            ) : (
              <li
                key={`rank-${rank}`}
                aria-label={`Tied ${rank}`}
                className="border-violet/15 grid grid-cols-[38px_10px_1fr] border-t first:border-t-0"
              >
                <span className="text-violet sticky top-2 z-[1] self-start pt-[3px] text-lg leading-[50px] font-black italic">
                  {rank}
                </span>
                <span
                  aria-hidden="true"
                  className="border-violet/60 my-[25px] rounded-l-[7px] border-2 border-r-0"
                />
                <ul>
                  {group.map((item) => (
                    <li
                      key={item.name}
                      className="border-violet/15 border-t pl-2.5 first:border-t-0"
                    >
                      {row(item)}
                    </li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ol>
      )}
      {limit && items.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="border-violet/45 bg-violet/10 text-cream focus-visible:outline-cream my-3.5 flex min-h-[52px] w-full items-center justify-center rounded-2xl border-[1.5px] text-[15px] font-extrabold focus-visible:outline-2"
        >
          {showAll
            ? `Show top ${limit}`
            : `Show all ${items.length} ${kind === "teams" ? "teams" : "players"}`}
        </button>
      )}
    </div>
  );
}
