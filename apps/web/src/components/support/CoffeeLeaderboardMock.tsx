"use client";

import { useState } from "react";
import { CoffeeCup } from "./CoffeeCup";

/*
 * MOCK, for choosing a design: three ways to show a coffee leaderboard, fed
 * with example data. Nothing here reads or writes real donors. The switch in
 * the corner changes the design and the data; it comes out before shipping.
 */

type Donor = { name: string | null; coffees: number };

const DATA: Record<string, { label: string; rows: Donor[]; example: boolean }> =
  {
    real: {
      label: "Today",
      // The one coffee so far, unclaimed.
      rows: [{ name: null, coffees: 3 }],
      example: false,
    },
    several: {
      label: "Several",
      rows: [
        { name: "Backboard Betty", coffees: 5 },
        { name: "Rim Ruiner", coffees: 3 },
        { name: null, coffees: 3 },
        { name: "Glass Cleaner", coffees: 1 },
      ],
      example: true,
    },
    empty: { label: "Empty", rows: [], example: true },
    long: {
      label: "Long name",
      rows: [
        { name: "The Man Who Waited For The Ball To Drop", coffees: 4 },
        { name: null, coffees: 3 },
      ],
      example: true,
    },
  };

const VARIANTS = {
  a: "Cup rows",
  b: "Podium",
  c: "Scoreboard",
} as const;
type Variant = keyof typeof VARIANTS;

/** Shared rank for ties: 5, 3, 3, 1 ranks as 1, 2, 2, 4. */
function ranked(rows: Donor[]) {
  const sorted = [...rows].sort((a, b) => b.coffees - a.coffees);
  return sorted.map((row, i) => ({
    ...row,
    rank: sorted.findIndex((r) => r.coffees === row.coffees) + 1,
    tied:
      sorted.filter((r) => r.coffees === row.coffees).length > 1 ? true : false,
    key: `${row.name ?? "anon"}-${i}`,
  }));
}

function Name({ name }: { name: string | null }) {
  return name ? (
    <span className="text-cream block truncate">{name}</span>
  ) : (
    <span className="text-cream/55 block truncate italic">Anonymous</span>
  );
}

function Cups({
  n,
  size = "size-5",
  max = 5,
}: {
  n: number;
  size?: string;
  max?: number;
}) {
  const shown = Math.min(n, max);
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => (
        <CoffeeCup key={i} className={size} full steam={false} />
      ))}
      {n > shown && (
        <span className="text-cream/60 ml-1 text-xs font-black">
          +{n - shown}
        </span>
      )}
    </span>
  );
}

function Empty() {
  return (
    <p className="text-cream/70 px-4 py-6 text-center text-[15px] font-bold">
      No names on the board yet. Buy a coffee and yours goes first.
    </p>
  );
}

/** A: a list, each donor with a row of cups and the count. */
function CupRows({ rows }: { rows: Donor[] }) {
  if (!rows.length) return <Empty />;
  return (
    <ol className="divide-violet/15 divide-y">
      {ranked(rows).map((r) => (
        <li
          key={r.key}
          className="grid grid-cols-[2.25rem_1fr_auto_2.5rem] items-center gap-3 py-3"
        >
          <span className="text-violet font-numerals text-right text-lg">
            {r.rank}
          </span>
          <span className="min-w-0 text-[15px] font-extrabold">
            <Name name={r.name} />
          </span>
          <span className="sm:hidden">
            <Cups n={r.coffees} max={3} />
          </span>
          <span className="hidden sm:block">
            <Cups n={r.coffees} />
          </span>
          <span className="text-cream font-numerals text-right text-2xl">
            {r.coffees}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** B: the top three on a podium of cup stacks, the rest listed under it. */
function Podium({ rows }: { rows: Donor[] }) {
  if (!rows.length) return <Empty />;
  const all = ranked(rows);
  const top = all.slice(0, 3);
  // Second, first, third, as podiums stand.
  const order = [top[1], top[0], top[2]].filter(Boolean);
  // By place: first tallest, then second, then third.
  const heights = ["h-28", "h-20", "h-14"];
  return (
    <div>
      <div className="flex items-end justify-center gap-3 px-2 pt-4">
        {order.map((r) => {
          const place = top.indexOf(r!);
          return (
            <div
              key={r!.key}
              className="flex w-[30%] min-w-0 flex-col items-center gap-2"
            >
              <Cups n={r!.coffees} size="size-4 sm:size-6" max={3} />
              <div className="w-full min-w-0 text-center text-[14px] font-extrabold">
                <Name name={r!.name} />
              </div>
              <div
                className={`bg-badge grain flex w-full flex-col items-center justify-start rounded-t-xl pt-2 ${heights[place]}`}
              >
                <span className="text-cream font-numerals text-shadow-badge text-3xl">
                  {r!.coffees}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {all.length > 3 && (
        <ol className="divide-violet/15 mt-3 divide-y">
          {all.slice(3).map((r) => (
            <li
              key={r.key}
              className="grid grid-cols-[2.25rem_1fr_2.5rem] items-center gap-3 py-2.5"
            >
              <span className="text-violet font-numerals text-right">
                {r.rank}
              </span>
              <span className="min-w-0 text-[14px] font-extrabold">
                <Name name={r.name} />
              </span>
              <span className="text-cream font-numerals text-right text-xl">
                {r.coffees}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const LED = "font-mono tracking-[0.15em] pl-[0.15em]";

/** C: in the season scoreboard's LED style, as an arcade high-score table. */
function Scoreboard({ rows }: { rows: Donor[] }) {
  return (
    <div className="bg-badge grain overflow-hidden rounded-[18px] border-2 border-[rgb(240_225_182/0.35)] p-3.5 shadow-[0_12px_28px_rgb(5_2_20/0.45)]">
      <div
        className={`${LED} text-center text-[11px] text-[#ffd36b] uppercase [text-shadow:0_0_6px_rgb(255_211_107/0.6)]`}
      >
        High scores · coffees
      </div>
      <div className="mt-3 rounded-[10px] bg-[rgb(10_4_30/0.45)] px-3 py-2">
        {rows.length ? (
          <ol>
            {ranked(rows).map((r) => (
              <li
                key={r.key}
                className={`${LED} grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-1.5 text-[15px] uppercase`}
              >
                <span className="text-[#ffd36b] [text-shadow:0_0_6px_rgb(255_211_107/0.6)]">
                  {String(r.rank).padStart(2, "0")}
                </span>
                <span
                  className={`min-w-0 truncate ${r.name ? "text-cream" : "text-cream/50"}`}
                >
                  {r.name ?? "Anonymous"}
                </span>
                <span className="text-[#ff6fd8] tabular-nums [text-shadow:0_0_8px_rgb(255_111_216/0.6)]">
                  {String(r.coffees).padStart(2, "0")}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p
            className={`${LED} text-cream/60 py-3 text-center text-[13px] uppercase`}
          >
            Insert coffee to play
          </p>
        )}
      </div>
    </div>
  );
}

export function CoffeeLeaderboardMock() {
  const [variant, setVariant] = useState<Variant>("a");
  const [data, setData] = useState<keyof typeof DATA>("real");
  const set = DATA[data]!;
  const Board = { a: CupRows, b: Podium, c: Scoreboard }[variant];

  return (
    <>
      <section aria-labelledby="coffee-board" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="coffee-board"
            className="text-cream text-2xl font-black tracking-[-0.02em]"
          >
            Coffee leaderboard
          </h2>
          <span className="text-cream/50 text-xs font-bold">2026/27</span>
        </div>
        {set.example && (
          <p className="w-fit rounded-md bg-[rgb(255_111_216/0.15)] px-2 py-0.5 text-xs font-black text-[#ff6fd8] uppercase">
            Example data
          </p>
        )}
        {variant === "c" ? (
          <Board rows={set.rows} />
        ) : (
          <div className="bg-panel border-violet/20 rounded-[20px] border px-4 py-2">
            <Board rows={set.rows} />
          </div>
        )}
        <p className="text-cream/55 text-[13px] font-bold">
          Buy a coffee to get your name on the board, or stay anonymous.
        </p>
      </section>

      {/* The mock's switch: not part of the design. */}
      <div className="fixed right-3 bottom-3 z-50 flex flex-col gap-2 rounded-xl border border-white/20 bg-black/85 p-3 text-xs text-white shadow-lg">
        <span className="font-black uppercase opacity-60">Mock switch</span>
        <div className="flex gap-1">
          {(Object.keys(VARIANTS) as Variant[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={`rounded px-2 py-1 font-bold ${variant === v ? "bg-white text-black" : "bg-white/10"}`}
            >
              {v.toUpperCase()} · {VARIANTS[v]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {Object.entries(DATA).map(([k, d]) => (
            <button
              key={k}
              type="button"
              onClick={() => setData(k)}
              className={`rounded px-2 py-1 font-bold ${data === k ? "bg-white text-black" : "bg-white/10"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
