"use client";

import { useEffect, useRef, useState } from "react";

interface StatsPerWedgie {
  fga: number;
  possessions: number;
  games: number;
  minutes: number;
}

interface TypingStatsProps {
  stats: StatsPerWedgie;
}

type StatKey = keyof StatsPerWedgie;
const STATS_ORDER: StatKey[] = ["fga", "possessions", "games", "minutes"];

const LABELS: Record<StatKey, string> = {
  fga: "shots",
  possessions: "possessions",
  games: "games",
  minutes: "minutes played",
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function TypingStats({ stats }: TypingStatsProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  // What is on screen right now, so a new phrase erases from there
  const shownRef = useRef("");

  const key = STATS_ORDER[index % STATS_ORDER.length]!;
  const value = stats[key];
  const target = `${Number.isNaN(value) ? 0 : value.toLocaleString()} ${LABELS[key]}`;

  useEffect(() => {
    // Each run has its own flag. A flag shared between runs was reset by the
    // next run, so an interrupted run kept typing over it and cut it short.
    let cancelled = false;
    const show = (t: string) => {
      shownRef.current = t;
      setText(t);
    };

    const run = async () => {
      const shown = shownRef.current;
      for (let i = shown.length - 1; i >= 0; i--) {
        await wait(50);
        if (cancelled) return;
        show(shown.slice(0, i));
      }
      await wait(500);
      for (let i = 1; i <= target.length; i++) {
        if (cancelled) return;
        show(target.slice(0, i));
        await wait(100);
      }
      await wait(2500);
      if (cancelled) return;
      setIndex((n) => n + 1);
    };

    void run();
    return () => {
      cancelled = true;
    };
    // The phrase, not the stats object, so a new object with the same numbers
    // does not restart it
  }, [target]);

  const [amount, ...rest] = text.split(" ");

  return (
    <div className="text-cream w-full text-[15px]">
      <div className="relative flex min-h-14 flex-col items-center justify-center text-center">
        <span className="block font-extrabold">That&apos;s a wedgie every</span>
        <span className="text-2xl font-black">
          <span className="text-cream">{amount}</span>{" "}
          <span className="text-cream/80 font-extrabold">{rest.join(" ")}</span>
          <span className="animate-blink bg-cream mb-[-0.1em] ml-1 inline-block h-[1em] w-2" />
        </span>
      </div>
    </div>
  );
}
