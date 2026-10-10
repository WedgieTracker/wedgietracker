import type { Wedgie } from "@wedgietracker/core/types/wedgie";
import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";
import { gameTimeline } from "@wedgietracker/core/utils/gameMoment";
import { twitterProfileUrl } from "@wedgietracker/core/utils/twitterHandle";
import { CourtPositionDiagram } from "./CourtPositionDiagram";
import { GameTimeline } from "./GameTimeline";

interface WedgieInfoPanelProps {
  wedgie: Wedgie & {
    types: { name: string }[];
  };
}

function formatDate(date: string | Date) {
  const d = new Date(date);
  if (isGemsDate(d)) {
    return GEMS_EMOJI;
  }
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function WedgieInfoPanel({ wedgie }: WedgieInfoPanelProps) {
  const timeline = gameTimeline(wedgie);
  return (
    <div className="relative flex min-h-full w-full flex-col p-6 px-4 max-lg:min-h-[320px] sm:px-6 sm:pb-24 md:px-8 lg:pb-6">
      <div className="space-y-2 sm:space-y-4">
        <div className="sm:text-wedgie-number flex flex-row items-center justify-start gap-4 text-xl leading-none">
          <h2 className="bg-pink text-yellow mb-2 flex size-[70px] flex-row items-center justify-center rounded-xl px-4 py-2 text-[1.6em] font-black">
            <span className="text-darkpurple mt-[.75em] text-[.5em]">#</span>
            {wedgie.number ?? "1"}
          </h2>
          <div>
            <p className="text-yellow text-[.9em] font-bold tracking-wider">
              {formatDate(wedgie.wedgieDate)}
            </p>
            {wedgie.seasonName && wedgie.seasonName !== "GEMS" && (
              <p className="mt-[.5em] text-[.5em] tracking-wider text-white uppercase">
                {`${wedgie.seasonName} Season`}
              </p>
            )}
          </div>
          {/* On phones the diagram sits in the header row, leaving the rows below full width. */}
          <div className="relative ml-auto w-[64px] shrink-0 self-start sm:hidden">
            <CourtPositionDiagram
              position={wedgie.position}
              dotClassName="size-2"
            />
          </div>
        </div>

        <div
          className="sm:text-wedgie-number grid items-baseline gap-2 text-sm sm:gap-3"
          style={{ gridTemplateColumns: "70px 1fr" }}
        >
          <p className="text-right text-[.75em] font-bold tracking-wider text-white/60 uppercase">
            Player
          </p>
          <p className="text-yellow text-[1.25em] font-bold">
            {wedgie.playerName}
          </p>

          <p className="text-right text-[.75em] font-bold tracking-wider text-white/60 uppercase">
            Teams
          </p>
          <p className="text-[1.25em] font-bold text-white">
            <span className="text-pink">{wedgie.teamName}</span>{" "}
            {!wedgie.teamAgainstName.includes("Unknown")
              ? `vs ${wedgie.teamAgainstName}`
              : ""}
          </p>

          <p className="text-right text-[.75em] font-bold tracking-wider text-white/60 uppercase">
            Type
          </p>
          <p className="text-[1em] text-white">
            {wedgie.types.map((type) => type.name).join(", ")}
          </p>

          {wedgie.shoutouts?.length > 0 && (
            <>
              <p className="text-right text-[.75em] font-bold tracking-wider text-white/60 uppercase">
                Shoutout
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {wedgie.shoutouts.map((handle) => (
                  <li key={handle}>
                    <a
                      href={twitterProfileUrl(handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:border-yellow hover:bg-yellow hover:text-darkpurple block rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[.75em] font-bold text-white transition-colors duration-200"
                    >
                      @{handle}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {timeline && (
            <>
              <span aria-hidden="true" />
              <div className="pt-1">
                <GameTimeline timeline={timeline} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Between phone and desktop widths; on desktop the modal pins it instead. */}
      <div className="absolute bottom-6 left-6 hidden w-[70px] sm:block md:left-8 lg:hidden">
        <CourtPositionDiagram position={wedgie.position} />
      </div>
    </div>
  );
}
