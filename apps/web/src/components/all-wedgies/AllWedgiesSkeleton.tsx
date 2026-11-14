import { PageHeading } from "~/components/shared/PageHeading";

/**
 * What All wedgies shows while it loads: the same heading, search, pills and
 * card grid as the real page with nothing in them, so nothing moves when the
 * wedgies arrive.
 */
export function AllWedgiesSkeleton() {
  return (
    <div aria-busy="true" className="container mx-auto max-w-7xl text-white">
      <PageHeading
        title="All wedgies"
        badge={
          <span aria-hidden="true" className="invisible tabular-nums">
            000
          </span>
        }
      />
      <div className="mt-8">
        <div className="border-violet/40 bg-night min-h-[50px] rounded-2xl border-2" />
        <div className="mt-2.5 flex gap-1.5">
          {["Season", "Type", "When"].map((label) => (
            <span
              key={label}
              className="bg-panel border-violet/30 text-cream/40 inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-[13.5px] font-extrabold"
            >
              {label}
              <span aria-hidden="true" className="text-[11px] opacity-60">
                ▾
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="bg-panel/60 h-[95.6px] animate-pulse rounded-[20px]"
          />
        ))}
      </div>
    </div>
  );
}
