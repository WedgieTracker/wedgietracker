"use client";

import { useEffect, type RefObject } from "react";

/** Where a filter pill's choices open, under the row of pills. */
export const POPOVER_CLASS =
  "bg-panel border-violet/35 scrollbar-wt absolute top-12 left-0 z-20 max-h-[min(340px,60svh)] w-full overflow-y-auto rounded-2xl border p-2 shadow-[0_14px_30px_rgb(5_2_20/0.6)] sm:w-[380px]";

/** Closes an open popover on Escape or a press outside `ref`. */
export function useCloseOnOutside(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof PointerEvent && ref.current?.contains(e.target as Node))
        return;
      close();
    };
    document.addEventListener("pointerdown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [open, ref, close]);
}

/** A filter pill that opens a popover. It turns cream once it's set. */
export function FilterPill({
  set,
  open,
  onClick,
  children,
}: {
  set: boolean;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={`focus-visible:outline-cream inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-[13.5px] font-extrabold transition-colors focus-visible:outline-2 ${
        set
          ? "bg-cream border-cream text-night"
          : "bg-panel border-violet/30 text-cream hover:border-cream/60"
      }`}
    >
      {children}
      <span aria-hidden="true" className="text-[11px] opacity-60">
        ▾
      </span>
    </button>
  );
}

/**
 * A pill's label. The Season pill is sized for its widest value (a season
 * like 2026/27) so it doesn't grow, and push the next pills along, when the
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

/** A small cut gem, marking GEMS (wedgies that sit outside the seasons). */
export function GemIcon() {
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

/** A small heading inside a popover, like "Seasons". */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-cream/45 px-2.5 pt-2 pb-1 text-[11px] font-black tracking-[0.08em] uppercase">
      {children}
    </div>
  );
}

/**
 * One choice in a popover: its name, a bar for how many wedgies it has
 * against the biggest in the list, the count, and a tick when chosen. The Any
 * row (value "") has no bar.
 */
export function CountRow({
  value,
  label,
  count,
  max,
  on,
  onPick,
}: {
  value: string;
  label: string;
  count: number;
  max: number;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
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
}
