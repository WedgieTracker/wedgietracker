"use client";

import { useEffect, useId, useRef, useState } from "react";

const RADIUS = 58;
const CENTRE = 70;

/** A point on the arc for a value, where the far end of the arc is `max`. */
function arcPoint(value: number, max: number) {
  const angle = Math.PI * (1 - Math.min(value, max) / max);
  return {
    x: CENTRE + RADIUS * Math.cos(angle),
    y: CENTRE - RADIUS * Math.sin(angle),
  };
}

/**
 * This season's pace on an arc that ends at the record, so how full it is
 * says how close the season is. The record under the far end opens a note
 * saying which season set it.
 */
export function PaceGauge({
  pace,
  record,
  recordSeason,
}: {
  pace: number;
  record: number;
  recordSeason: string | null;
}) {
  const id = `pace${useId().replace(/:/g, "")}`;
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;
  const wrapRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // With a mouse the note opens on hover and stays while the pointer is on
  // the record or the note; a short delay lets it cross the gap between them.
  const hover = (on: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (on) setHovered(true);
    else leaveTimer.current = setTimeout(() => setHovered(false), 150);
  };
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!pinned) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (
        e instanceof PointerEvent &&
        wrapRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setPinned(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [pinned]);

  const max = Math.max(record, pace, 1);
  const end = arcPoint(pace, max);

  return (
    <div
      ref={wrapRef}
      className="bg-panel border-violet/20 relative rounded-[20px] border px-3.5 pt-[18px] pb-3 text-center"
    >
      <svg
        viewBox="0 0 140 80"
        className="mx-auto block w-full max-w-[245px] overflow-visible"
        role="img"
        aria-label={`On pace for ${pace} wedgies this season. The record is ${record}.`}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="1">
            <stop offset="0" stopColor="#5f84e6" />
            <stop offset="1" stopColor="#a65ff5" />
          </linearGradient>
        </defs>
        <path
          d="M12 70A58 58 0 0 1 128 70"
          fill="none"
          stroke="rgb(154 92 245 / 0.18)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {pace > 0 && (
          <path
            d={`M12 70A58 58 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`}
            fill="none"
            stroke={`url(#${id}-fill)`}
            strokeWidth="11"
            strokeLinecap="round"
          />
        )}
        <text
          x="70"
          y="36"
          textAnchor="middle"
          fontSize="8.5"
          className="fill-cream/70 font-bold"
        >
          On pace for
        </text>
        <text
          x="69"
          y="70"
          textAnchor="middle"
          fontSize="36"
          className="fill-cream font-black italic"
          letterSpacing="-1.4"
        >
          {pace}
        </text>
      </svg>

      <div className="relative mx-auto mt-1 h-[26px] max-w-[245px]">
        <span
          className="text-cream/50 absolute top-1/2 left-[8.57%] -translate-x-1/2 -translate-y-1/2 text-xs font-extrabold"
          aria-hidden="true"
        >
          0
        </span>
        <button
          type="button"
          onClick={() => setPinned((o) => !o)}
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          aria-expanded={open}
          aria-controls={`${id}-note`}
          className="text-cream focus-visible:outline-cream/60 absolute top-1/2 left-[91.43%] inline-flex min-h-9 -translate-x-1/2 -translate-y-1/2 items-center px-0.5 text-sm font-black before:absolute before:inset-[-4px_-8px_-4px_-26px] before:content-[''] focus-visible:rounded-md focus-visible:outline-[1.5px] focus-visible:outline-offset-2"
        >
          <span
            aria-hidden="true"
            className="border-cream/50 text-cream/70 absolute top-1/2 right-[calc(100%+5px)] grid size-[17px] -translate-y-1/2 place-items-center rounded-full border-[1.6px] font-serif text-[10.5px] font-black italic"
          >
            i
          </span>
          {record}
          <span className="sr-only">: what is this?</span>
        </button>
        {open && (
          <div
            id={`${id}-note`}
            role="note"
            onPointerEnter={hover(true)}
            onPointerLeave={hover(false)}
            // Opens above the record, over the gauge, so it stays in view even
            // where the stats are pinned to the screen on desktop.
            className="bg-cream text-night absolute -right-2 bottom-[calc(100%+10px)] -left-2 z-20 rounded-[14px] px-3.5 py-3 text-left text-[13px] leading-snug font-bold shadow-[0_12px_28px_rgb(5_2_20/0.5)]"
          >
            <b className="font-black">{record} is the record.</b> The most
            wedgies in a season
            {recordSeason ? `, set in ${recordSeason}` : ""}.
          </div>
        )}
        {open && (
          <span
            aria-hidden="true"
            // Same 91.43% as the record, so the arrow always points at it.
            className="bg-cream absolute bottom-[calc(100%+4px)] left-[91.43%] z-20 size-3 -translate-x-1/2 rotate-45 rounded-[2px]"
          />
        )}
      </div>
    </div>
  );
}
