/**
 * A tear-off calendar page counting the days since the last wedgie. On the
 * day of a new one it shows NEW / WEDGIE with a pink circle drawn round it,
 * like a date circled on a real calendar.
 */
export function DaysCalendar({ days }: { days: number }) {
  const isNew = days === 0;
  const label = isNew
    ? "New wedgie today"
    : `${days} ${days === 1 ? "day" : "days"} without a wedgie`;

  return (
    <div
      role="img"
      aria-label={label}
      className="relative w-[132px] overflow-hidden rounded-[14px] shadow-[0_8px_18px_rgb(5_2_20/0.45)] md:w-[170px]"
    >
      <div className="bg-glow before:bg-cream after:bg-cream relative h-[26px] before:absolute before:-top-1.5 before:left-[26px] before:h-[18px] before:w-2 before:rounded-sm before:shadow-[0_2px_0_rgb(0_0_0/0.25)] before:content-[''] after:absolute after:-top-1.5 after:right-[26px] after:h-[18px] after:w-2 after:rounded-sm after:shadow-[0_2px_0_rgb(0_0_0/0.25)] after:content-['']" />
      <div className="bg-cream relative flex min-h-[118px] flex-col items-center justify-center pt-1.5 pb-3.5 text-center md:min-h-[156px]">
        {isNew ? (
          <>
            <svg
              viewBox="0 0 120 80"
              aria-hidden="true"
              className="absolute inset-x-1 top-2 bottom-2.5 h-[calc(100%-18px)] w-[calc(100%-8px)] overflow-visible"
            >
              <path
                className="wt-circle-date"
                pathLength={100}
                d="M64 9C34 6 10 17 9 38c-1 22 24 34 55 33 31-1 50-14 49-34C112 18 92 7 60 8.5c9-.4 18 .6 27 3.5"
                fill="none"
                stroke="#ff4fc8"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="relative text-[25px] leading-[0.92] font-black tracking-[-0.02em] text-[#e0359f] md:text-[32px]">
              NEW
            </span>
            <span className="relative text-[25px] leading-[0.92] font-black tracking-[-0.02em] text-[#502394] md:text-[32px]">
              WEDGIE
            </span>
          </>
        ) : (
          <>
            <span className="text-[64px] leading-none font-black tracking-[-0.04em] text-[#502394] italic md:text-[84px]">
              {days}
            </span>
            <span className="text-night mt-0.5 text-xs leading-tight font-black md:text-sm">
              {days === 1 ? "day" : "days"} without
              <br />a wedgie
            </span>
          </>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-[repeating-linear-gradient(90deg,#d9c894_0_6px,transparent_6px_9px)]"
        />
      </div>
    </div>
  );
}
