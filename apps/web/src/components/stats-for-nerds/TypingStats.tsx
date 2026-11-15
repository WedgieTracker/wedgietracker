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
/** Digit flaps: up to 9999, written without a thousands comma. */
const NUM_FLAPS = 4;
const WORD_FLAPS = 11;
/** Column widths: the digits, a half-width gap, then the letters. */
const TEMPLATE = `repeat(${NUM_FLAPS}, 1fr) 0.5fr repeat(${WORD_FLAPS}, 1fr)`;
/** The same total in flap widths, for sizing the letters. */
const UNITS = NUM_FLAPS + 0.5 + WORD_FLAPS;

/** The figure's flaps only carry digits, the word's only letters. */
const DIGITS = " 0123456789";
const LETTERS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STEP_MS = 45;
const HOLD_MS = 4200;

/** The board's text for one stat: the figure right-aligned, the word left. */
function boardText(stats: StatsPerWedgie, i: number) {
  const s = STATS[i % STATS.length]!;
  const value = Math.min(stats[s.key], 9999);
  return {
    digits: [...String(value).padStart(NUM_FLAPS, " ")],
    word: [...s.word.padEnd(WORD_FLAPS, " ").slice(0, WORD_FLAPS)],
  };
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
 * "A wedgie every 2,837 possessions" on a board across the bottom of the
 * season card: a fixed label, then a row of split flaps cycling through
 * possessions, shots, games and minutes. The flaps scale with the card's
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
    <div
      className="wt-board"
      style={
        {
          "--cols": UNITS,
          gridTemplateColumns: TEMPLATE,
        } as React.CSSProperties
      }
    >
      <p className="sr-only" aria-live="polite">
        That&apos;s a wedgie every {stats[current.key].toLocaleString("en-US")}{" "}
        {current.word.toLowerCase()}
      </p>
      <span className="wt-board-label" aria-hidden="true">
        A wedgie every
      </span>
      {text.digits.map((ch, i) => (
        <Flap key={`d${i}`} target={ch} delay={i * 25} amber />
      ))}
      <span aria-hidden="true" />
      {text.word.map((ch, i) => (
        <Flap
          key={`w${i}`}
          target={ch}
          delay={(NUM_FLAPS + i) * 25}
          amber={false}
        />
      ))}
    </div>
  );
}
