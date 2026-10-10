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
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${timeline.progress * 100}%` }}
                  >
                    {timeline.tone === "clutch" && (
                      <span className="wt-clutch-ring bg-pink absolute inset-0 rounded-full" />
                    )}
                    {timeline.tone === "garbage" &&
                      [0, 1.2].map((delay) => (
                        <span
                          key={delay}
                          className="wt-snooze absolute -top-1 left-2 text-[.6rem] font-black text-white/60"
                          style={{ animationDelay: `${delay}s` }}
                          aria-hidden="true"
                        >
                          z
                        </span>
                      ))}
                    <span
                      className={`ring-darkpurple-dark absolute inset-0 rounded-full ring-2 ${tone.dot}`}
                    />
                  </div>
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
        {timeline.tone === "clutch" ? (
          <span className="wt-heartbeat">{timeline.label}</span>
        ) : timeline.tone === "garbage" ? (
          <>
            <span className="wt-wobble mr-1" aria-hidden="true">
              🗑️
            </span>
            {timeline.label}
          </>
        ) : (
          timeline.label
        )}
      </p>
    </div>
  );
}
