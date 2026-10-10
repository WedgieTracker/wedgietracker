import type { GameTimeline as Timeline } from "@wedgietracker/core/utils/gameMoment";

const TONE = {
  normal: { dot: "bg-yellow", fill: "bg-white/35", text: "text-yellow" },
  clutch: { dot: "bg-pink", fill: "bg-pink/50", text: "text-pink" },
  garbage: { dot: "bg-white/70", fill: "bg-white/25", text: "text-white/60" },
} as const;

/**
 * The game as a row of quarters, filled up to the moment of the wedgie, with
 * the band (e.g. "Late Q1", "Clutch time") underneath.
 */
export function GameTimeline({ timeline }: { timeline: Timeline }) {
  const tone = TONE[timeline.tone];
  return (
    <div
      className="w-full max-w-[320px]"
      aria-label={`When: ${timeline.label}`}
      role="img"
    >
      <div className="flex gap-1">
        {timeline.segments.map((segment, i) => {
          const filled =
            i < timeline.active
              ? 1
              : i === timeline.active
                ? timeline.progress
                : 0;
          return (
            <div key={segment} className="flex-1">
              <div className="relative h-1.5 rounded-full bg-white/10">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${tone.fill}`}
                  style={{ width: `${filled * 100}%` }}
                />
                {i === timeline.active && (
                  <div
                    className={`ring-darkpurple-dark absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ${tone.dot}`}
                    style={{ left: `${timeline.progress * 100}%` }}
                  />
                )}
              </div>
              <p
                className={`mt-1.5 text-center text-[.65rem] font-bold tracking-wider ${
                  i === timeline.active ? tone.text : "text-white/40"
                }`}
              >
                {segment}
              </p>
            </div>
          );
        })}
      </div>
      <p
        className={`mt-1 text-[.75rem] font-black tracking-wider uppercase ${tone.text}`}
      >
        {timeline.label}
      </p>
    </div>
  );
}
