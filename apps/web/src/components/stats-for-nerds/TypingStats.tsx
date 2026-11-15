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
/** Columns on the board: the figure, one blank, then the word. */
const COLS = NUM_FLAPS + 1 + WORD_FLAPS;
/** The top row, centred over the figure and word. */
const LEAD = "A WEDGIE EVERY";
const LEAD_ROW = [..." ".repeat(Math.floor((COLS - LEAD.length) / 2)), ...LEAD]
  .concat([..." ".repeat(COLS)])
  .slice(0, COLS);
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
  return [...num, " ", ...s.word.padEnd(WORD_FLAPS, " ").slice(0, WORD_FLAPS)];
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
 * "A wedgie every / 2,837 possessions" on a split-flap board across the
 * bottom of the season card, cycling through possessions, shots, games and
 * minutes. Two rows of a fixed number of flaps that scale with the card's
 * width, so the board fills it and never changes size.
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
    <div className="wt-board" style={{ "--cols": COLS } as React.CSSProperties}>
      <p className="sr-only" aria-live="polite">
        That&apos;s a wedgie every {stats[current.key].toLocaleString("en-US")}{" "}
        {current.word.toLowerCase()}
      </p>
      {LEAD_ROW.map((ch, i) => (
        <Flap key={`lead-${i}`} target={ch} delay={i * 20} amber={false} />
      ))}
      {text.map((ch, i) => (
        <Flap key={i} target={ch} delay={300 + i * 25} amber={i < NUM_FLAPS} />
      ))}
    </div>
  );
}
