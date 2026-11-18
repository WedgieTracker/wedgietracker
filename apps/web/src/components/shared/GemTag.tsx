/**
 * Marks a GEMS wedgie (one that sits outside the seasons, like a warm-up) where its
 * date would go, since GEMS have no real date.
 */
export function GemTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`bg-gem text-night inline-flex items-center gap-1 rounded-md py-0.5 pr-1.5 pl-1 align-middle text-[10px] leading-none font-black tracking-[0.06em] not-italic ${className}`}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true" className="size-[9px]">
        <path d="M3 1.5h6L11 4.5 6 10.5 1 4.5z" fill="currentColor" />
        <path
          d="M1 4.5h10M4.2 1.5 6 4.5l1.8-3M6 4.5v6"
          stroke="rgb(240 225 182 / 0.45)"
          strokeWidth=".7"
          fill="none"
        />
      </svg>
      GEM
    </span>
  );
}
