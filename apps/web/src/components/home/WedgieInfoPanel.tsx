import type { Wedgie } from "@wedgietracker/core/types/wedgie";
import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";
import { gameMoment } from "@wedgietracker/core/utils/gameMoment";
import {
  tweetUrl,
  twitterProfileUrl,
} from "@wedgietracker/core/utils/twitterHandle";
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
  const moment = gameMoment(wedgie);
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
          {/* On phones the diagram sits in the header row, leaving the rows below full width. */}
          <div className="relative ml-auto w-[64px] shrink-0 self-start sm:hidden">
            <CourtPositionDiagram
              position={wedgie.position}
              dotClassName="size-2"
            />
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

          {moment && (
            <>
              <p className="text-right text-[.75em] font-bold tracking-wider text-white/60 uppercase">
                When
              </p>
              <p className="text-[1em] text-white">{moment}</p>
            </>
          )}

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
        </div>

        {wedgie.noDunksTweet && (
          <a
            href={tweetUrl("NoDunksInc", wedgie.noDunksTweet.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:border-yellow block rounded-xl border border-white/15 bg-white/5 p-3 transition-colors duration-200"
          >
            <p className="text-[.7rem] font-bold tracking-wider text-white/60 uppercase">
              @NoDunksInc ·{" "}
              {new Date(wedgie.noDunksTweet.postedAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              )}
            </p>
            <p className="mt-1 line-clamp-4 text-sm text-white/90">
              {wedgie.noDunksTweet.text}
            </p>
            <p className="text-yellow mt-2 text-xs font-bold">View on X →</p>
          </a>
        )}
      </div>

      <div className="relative hidden w-full max-w-[150px] sm:block">
        <CourtPositionDiagram position={wedgie.position} />
      </div>
    </div>
  );
}
