"use client";

import { useEffect, useRef, useState } from "react";

interface StatsPerWedgie {
  fga: number;
  possessions: number;
  games: number;
  minutes: number;
}

const STATS: { key: keyof StatsPerWedgie; word: string }[] = [
  { key: "possessions", word: "POSSESSIONS" },
  { key: "fga", word: "SHOTS" },
  { key: "games", word: "GAMES" },
  { key: "minutes", word: "MINUTES" },
];
const NUM_FLAPS = 5;
const WORD_FLAPS = 11;
/** The figure's flaps only carry digits, the word's only letters. */
const DIGITS = " 0123456789,";
const LETTERS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STEP_MS = 45;
const HOLD_MS = 4200;

/** The board's text for one stat: the figure right-aligned, the word left. */
function boardText(stats: StatsPerWedgie, i: number) {
  const s = STATS[i % STATS.length]!;
  const num = stats[s.key]
    .toLocaleString("en-US")
    .padStart(NUM_FLAPS, " ")
    .slice(-NUM_FLAPS);
  return [...num, ...s.word.padEnd(WORD_FLAPS, " ").slice(0, WORD_FLAPS)];
}

/** One flap. It steps through its characters in order until it reaches `target`. */
function Flap({
  target,
  delay,
  amber,
}: {
  target: string;
  delay: number;
  amber: boolean;
}) {
  const [shown, setShown] = useState(" ");
  const [flipping, setFlipping] = useState(false);
  const shownRef = useRef(" ");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (shownRef.current === target) {
        setFlipping(false);
        return;
      }
      const chars = amber ? DIGITS : LETTERS;
      const next =
        chars[(chars.indexOf(shownRef.current) + 1) % chars.length] ?? " ";
      shownRef.current = next;
      setShown(next);
      setFlipping(true);
      timer = setTimeout(step, STEP_MS);
    };
    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [target, delay, amber]);

  return (
    <span
      aria-hidden="true"
      className={`wt-flap ${amber ? "wt-flap-amber" : ""} ${flipping ? "wt-flap-flip" : ""}`}
    >
      {shown}
    </span>
  );
}

/**
 * "That's a wedgie every 2,837 possessions" on a split-flap board that cycles
 * through possessions, shots, games and minutes. The board has a fixed number
 * of flaps, so it never changes width.
 */
export function TypingStats({ stats }: { stats: StatsPerWedgie }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => i + 1), HOLD_MS);
    return () => clearInterval(id);
  }, []);

  const text = boardText(stats, index);
  const current = STATS[index % STATS.length]!;

  return (
    <div className="text-cream flex flex-col items-center gap-3 text-center">
      <p className="text-[15px] font-extrabold">That&apos;s a wedgie every</p>
      <p className="sr-only" aria-live="polite">
        {stats[current.key].toLocaleString("en-US")}{" "}
        {current.word.toLowerCase()}
      </p>
      <div className="wt-board">
        {text.map((ch, i) => (
          <span key={i} className="contents">
            {i === NUM_FLAPS && <span className="wt-board-gap" />}
            <Flap target={ch} delay={i * 25} amber={i < NUM_FLAPS} />
          </span>
        ))}
      </div>
    </div>
  );
}
