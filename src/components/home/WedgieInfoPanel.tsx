import type { Wedgie } from "~/types/wedgie";
import { GEMS_EMOJI, isGemsDate } from "~/utils/formatDate";
import { CourtPositionDiagram } from "./CourtPositionDiagram";

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
  return (
    <div className="relative flex w-full flex-col justify-between p-6 px-4 sm:px-6 md:p-8 lg:w-[35%]">
      <div className="space-y-2 sm:space-y-6">
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
        </div>

        <div
          className="sm:text-wedgie-number grid items-baseline gap-2 text-sm sm:gap-4"
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
        </div>
      </div>

      <div className="absolute right-1.5 bottom-16 w-full max-w-[80px] sm:relative sm:right-auto sm:bottom-auto sm:max-w-[150px]">
        <CourtPositionDiagram position={wedgie.position} />
      </div>
    </div>
  );
}
