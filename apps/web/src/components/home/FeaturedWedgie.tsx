import type { WedgieWithTypes } from "@wedgietracker/core/types/wedgie";
import { gameTimeline } from "@wedgietracker/core/utils/gameMoment";
import { CourtPositionDiagram } from "./CourtPositionDiagram";
import { LocalDate } from "~/components/shared/LocalDate";
import { PlayButton } from "./PlayIcon";

/** The quarters bar, in cream for the badge. */
function QuartersBar({ wedgie }: { wedgie: WedgieWithTypes }) {
  const timeline = gameTimeline({
    period: wedgie.period,
    gameClock: wedgie.gameClock,
    teamScore: wedgie.teamScore,
    opponentScore: wedgie.opponentScore,
    types: wedgie.types,
  });
  if (!timeline) return null;

  return (
    <span
      role="img"
      aria-label={`When: ${timeline.label}`}
      className="border-cream/20 mt-3 block border-t pt-3.5"
    >
      <span className="flex gap-[5px]">
        {timeline.segments.map((segment, i) => {
          const filled =
            i < timeline.active
              ? 1
              : i === timeline.active
                ? timeline.progress
                : 0;
          return (
            <span key={segment} className="block flex-1">
              <span className="bg-cream/20 relative block h-1.5 rounded-full">
                <span
                  className="bg-cream/55 absolute inset-y-0 left-0 block rounded-full"
                  style={{ width: `${filled * 100}%` }}
                />
                {i === timeline.active && (
                  <span
                    className="bg-cream absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_rgb(54_55_141/0.9),0_0_10px_rgb(240_225_182/0.6)]"
                    style={{ left: `${timeline.progress * 100}%` }}
                  />
                )}
              </span>
              <span
                className={`mt-2 block text-center text-[11px] font-extrabold ${
                  i === timeline.active ? "text-cream" : "text-cream/50"
                }`}
              >
                {segment}
              </span>
            </span>
          );
        })}
      </span>
      <span className="text-cream mt-2 block text-[13px] font-black">
        {timeline.label}
      </span>
    </span>
  );
}

/**
 * The newest wedgie, bigger than the rows below it: the badge with its
 * number, date, court and the moment in the game, then who and against whom.
 */
export function FeaturedWedgie({
  wedgie,
  onOpen,
}: {
  wedgie: WedgieWithTypes;
  onOpen: () => void;
}) {
  const opponent = wedgie.teamAgainstName.includes("Unknown")
    ? null
    : wedgie.teamAgainstName;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-glow focus-visible:outline-cream block w-full overflow-hidden rounded-3xl p-[1.5px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 md:grid"
    >
      <span className="bg-panel block overflow-hidden rounded-[22.5px] md:grid md:grid-cols-[300px_1fr]">
        <span className="bg-badge grain block px-[18px] pt-[18px] pb-4 md:flex md:flex-col md:justify-between">
          <span className="grid grid-cols-[1fr_auto] items-end gap-3 md:block">
            <span className="block">
              <span className="text-cream text-shadow-badge block text-[58px] leading-[0.95] font-black tracking-[-0.04em] italic">
                <span className="mr-[0.06em] text-[0.42em] tracking-normal opacity-55 [text-shadow:none]">
                  #
                </span>
                {wedgie.number ?? "1"}
              </span>
              <LocalDate
                date={wedgie.wedgieDate}
                className="text-cream/70 mt-1.5 block text-xs font-bold whitespace-nowrap"
              />
            </span>
            <span className="relative block w-[150px] md:mx-auto md:mt-3 md:w-[210px]">
              <CourtPositionDiagram
                position={wedgie.position}
                dotClassName="size-2.5"
              />
            </span>
          </span>
          <span className="block md:hidden">
            <QuartersBar wedgie={wedgie} />
          </span>
        </span>

        <span className="relative block p-[18px] md:flex md:flex-col md:px-6 md:py-[22px]">
          <span className="absolute top-[22px] right-[18px]">
            <PlayButton size="lg" />
          </span>
          <span className="text-cream block pr-[52px] text-[23px] leading-tight font-black tracking-[-0.01em] whitespace-nowrap">
            {wedgie.playerName}
          </span>
          <span className="text-cream/80 mt-1 block text-[14.5px] font-bold">
            <span className="text-violet font-black">{wedgie.teamName}</span>
            {opponent && ` vs ${opponent}`}
          </span>
          <span className="mt-3 flex flex-wrap gap-1.5">
            {wedgie.types.map((type) => (
              <span
                key={type.name}
                className="bg-violet/15 text-cream rounded-full px-[11px] py-1.5 text-[12.5px] font-extrabold"
              >
                {type.name}
              </span>
            ))}
          </span>
          <span className="mt-auto hidden md:block">
            <QuartersBar wedgie={wedgie} />
          </span>
          <span className="sr-only">Watch wedgie {wedgie.number}</span>
        </span>
      </span>
    </button>
  );
}
