"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Wedgie } from "@wedgietracker/core/types/wedgie";
import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";
import { gameTimeline } from "@wedgietracker/core/utils/gameMoment";
import {
  shoutoutNetwork,
  shoutoutProfileUrl,
} from "@wedgietracker/core/utils/shoutout";
import { CourtPositionDiagram } from "./CourtPositionDiagram";
import { GameTimeline } from "./GameTimeline";

interface WedgieInfoPanelProps {
  wedgie: Wedgie & {
    types: { name: string }[];
  };
}

/**
 * The night of the wedgie in the visitor's own format, with the weekday, e.g.
 * "Fri 13 Nov 2026" in the UK and "Fri, Nov 13, 2026" in the US. Filled in
 * once mounted, since the server can't know the visitor's locale.
 */
function NightDate({ date }: { date: string | Date }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date(date);
    setText(
      isGemsDate(d)
        ? GEMS_EMOJI
        : d.toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }),
    );
  }, [date]);
  return <span suppressHydrationWarning>{text ?? "\u00a0"}</span>;
}

/** A shoutouts label with an ⓘ that explains how to get one. */
function ShoutoutLabel() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;
  const id = useId();
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // With a mouse it opens on hover and stays while the pointer is on the ⓘ or
  // the note; a short delay lets the pointer cross the gap between them.
  const hover = (on: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (on) setHovered(true);
    else leaveTimer.current = setTimeout(() => setHovered(false), 150);
  };
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setPinned((o) => !o)}
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        className="border-cream/50 text-cream/70 hover:border-cream hover:text-cream focus-visible:outline-cream grid size-[17px] shrink-0 place-items-center rounded-full border-[1.5px] font-serif text-[10px] font-black italic focus-visible:outline-2"
      >
        i<span className="sr-only">How do shoutouts work?</span>
      </button>
      <p className="text-right text-[.75em] font-bold tracking-wider text-white/60 uppercase">
        Shoutout
      </p>
      {open && (
        <p
          id={id}
          role="note"
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          className="bg-cream text-night absolute right-4 left-4 z-20 mt-24 rounded-[14px] px-3.5 py-3 text-left text-[13px] leading-snug font-bold normal-case shadow-[0_12px_28px_rgb(5_2_20/0.5)] sm:right-6 sm:left-6 md:right-8 md:left-8"
        >
          Shoutouts go to whoever tags the wedgie first. Spot one in a game? Tag{" "}
          <a
            href="https://x.com/wedgietracker"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            @wedgietracker on X
          </a>{" "}
          or{" "}
          <a
            href="https://bsky.app/profile/wedgietracker.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            wedgietracker.com on Bluesky
          </a>{" "}
          and your name goes here.
        </p>
      )}
    </div>
  );
}

export function WedgieInfoPanel({ wedgie }: WedgieInfoPanelProps) {
  const timeline = gameTimeline(wedgie);
  return (
    <div className="relative flex min-h-full w-full flex-col p-6 px-4 max-lg:min-h-[320px] sm:min-h-[460px] sm:px-6 md:px-8">
      <div className="space-y-2 sm:space-y-4">
        <div className="sm:text-wedgie-number flex flex-row items-center justify-start gap-4 text-xl leading-none">
          <h2 className="bg-badge grain text-cream text-shadow-badge mb-2 flex size-[70px] flex-row items-center justify-center rounded-xl px-4 py-2 text-[1.6em] font-black italic">
            <span className="mt-[.75em] mr-[0.06em] text-[.45em] opacity-60 [text-shadow:none]">
              #
            </span>
            {wedgie.number ?? "1"}
          </h2>
          <div>
            <p className="text-cream text-[.9em] font-extrabold">
              <NightDate date={wedgie.wedgieDate} />
            </p>
            {wedgie.seasonName && wedgie.seasonName !== "GEMS" && (
              <p className="text-cream/60 mt-[.5em] text-[.5em] font-bold tracking-wider uppercase">
                {`${wedgie.seasonName} season`}
              </p>
            )}
          </div>
        </div>

        <div
          className="sm:text-wedgie-number grid items-baseline gap-2 text-sm sm:gap-3"
          style={{ gridTemplateColumns: "88px 1fr" }}
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
              <ShoutoutLabel />
              <ul className="flex flex-wrap gap-1.5">
                {wedgie.shoutouts.map((handle) => (
                  <li key={handle}>
                    <a
                      href={shoutoutProfileUrl(handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={
                        shoutoutNetwork(handle) === "bluesky"
                          ? `${handle} on Bluesky`
                          : `@${handle} on X`
                      }
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

      {/* Sticky to the bottom-left while the details scroll, on a fade of the
          panel's background. It stays in the flow, so at the end of a long
          list it sits below the details instead of over them. */}
      <div className="to-darkpurple via-darkpurple/90 pointer-events-none sticky bottom-0 -mx-4 mt-auto bg-gradient-to-b from-transparent px-4 pt-8 pb-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div className="relative w-[120px] sm:w-[150px] lg:w-[160px]">
          <CourtPositionDiagram
            position={wedgie.position}
            dotClassName="size-3"
          />
        </div>
      </div>
    </div>
  );
}
