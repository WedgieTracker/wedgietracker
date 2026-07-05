"use client";

import { useState } from "react";
import { WedgieModal } from "./WedgieModal";
import { CourtPositionDiagram } from "./CourtPositionDiagram";
import type { WedgieWithTypes } from "~/types/wedgie";
import { GEMS_EMOJI, isGemsDate } from "~/utils/formatDate";

interface WedgieProps {
  wedgie: WedgieWithTypes;
  variant?: "default" | "small";
  showSeason?: boolean;
  onWedgieClick?: (wedgie: WedgieWithTypes) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  previousWedgie?: WedgieWithTypes;
  nextWedgie?: WedgieWithTypes;
}

export function Wedgie({
  wedgie,
  variant = "default",
  showSeason = false,
  onWedgieClick,
  hasPrevious,
  hasNext,
  previousWedgie,
  nextWedgie,
}: WedgieProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Font size mappings based on variant
  const fontSizes = {
    default: {
      number: "clamp(2rem, 1.5rem + 3vw, 3.5rem)",
      hash: "clamp(0.875rem, 0.8rem + 0.5vw, 1rem)",
      date: "clamp(0.6rem, 0.3rem + 0.1vw, 0.7rem)",
      playerName: "clamp(1.1rem, .8rem + 1vw, 1.75rem)",
      teamName: "clamp(0.8rem, 0.6rem + 1vw, 1.125rem)",
      types: "clamp(0.7rem, 0.5rem + 1vw, 1rem)",
      watch: "clamp(0.7rem, 0.5rem + 0.3vw, 0.8rem)",
    },
    small: {
      number: "clamp(2rem, 1rem + 2vw, 2.5rem)",
      hash: "clamp(0.875rem, 0.7rem + 0.3vw, 0.875rem)",
      date: "clamp(0.6rem, 0.3rem + 0.1vw, 0.7rem)",
      playerName: "clamp(1.1rem, 0.8rem + 1vw, 1.25rem)",
      teamName: "clamp(0.8rem, 0.6rem + 1vw, 1rem)",
      types: "clamp(0.7rem, 0.5rem + 1vw, 0.875rem)",
      watch: "clamp(0.7rem, 0.5rem + 0.3vw, 0.7rem)",
    },
  };

  const sizes = fontSizes[variant];

  return (
    <>
      <button
        type="button"
        key={wedgie.id}
        className={`group bg-darkpurple-light/30 hover:bg-darkpurple-light/80 mb-2 flex w-full cursor-pointer items-center justify-between overflow-hidden text-left transition-all duration-300 ${
          variant === "small"
            ? "mb-0! rounded-xl border-0! pb-0! last:pb-0!"
            : "border-b-0 pb-0 first:rounded-t-xl last:mb-0 last:rounded-b-xl"
        }`}
        onClick={() => {
          if (onWedgieClick) {
            onWedgieClick(wedgie);
          } else {
            setIsModalOpen(true);
          }
        }}
      >
        <div
          className={`grid w-full grid-cols-[minmax(70px,auto)_minmax(0,1fr)_auto] items-center ${
            variant === "small"
              ? "grid-cols-[minmax(60px,auto)_minmax(0,1fr)_auto] gap-4 md:grid-cols-[minmax(80px,auto)_minmax(0,1fr)_auto]"
              : "grid-cols-[minmax(70px,auto)_minmax(0,1fr)_auto] gap-4 md:grid-cols-[minmax(90px,auto)_minmax(0,1fr)_auto]"
          }`}
        >
          <div
            className={`border-darkpurple bg-pink group-hover:border-yellow group-hover:bg-darkpurple/80 flex flex-col items-center overflow-hidden border transition-all duration-300 ${
              variant === "small"
                ? "rounded-xl lg:min-h-20 lg:min-w-20"
                : "min-w-[74px] rounded-xs group-first:rounded-tl-xl group-last:rounded-bl-xl lg:min-h-24 lg:min-w-24"
            }`}
          >
            <div className="mt-1">
              <span
                className="text-darkpurple/50 group-hover:text-yellow mr-[-0.2rem] leading-none font-bold transition-all duration-300"
                style={{ fontSize: sizes.hash }}
              >
                #
              </span>
              <span
                className="text-yellow min-w-15 leading-none font-black"
                style={{ fontSize: sizes.number }}
              >
                {wedgie.number ?? "1"}
              </span>
            </div>
            <div
              suppressHydrationWarning
              className={`text-darkpurple group-hover:text-yellow mb-2 leading-none font-black tracking-wide transition-all duration-300 ${sizes.date}`}
              style={{ fontSize: sizes.date }}
            >
              {isGemsDate(new Date(wedgie.wedgieDate))
                ? GEMS_EMOJI
                : new Date(wedgie.wedgieDate).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
            </div>
            <div
              className="border-yellow bg-yellow text-darkpurple group-hover:border-t-yellow group-hover:text-yellow w-full rounded-b-xs border-t px-3 py-0.5 text-center font-bold transition-all duration-300 group-last:rounded-bl-xl group-hover:bg-transparent"
              style={{ fontSize: sizes.watch }}
            >
              WATCH
            </div>
          </div>
          <div className="min-w-0">
            <h3
              className="shadow-lg-darkpurple text-yellow mb-0 truncate pb-1 leading-none font-bold"
              style={{
                textShadow: "0 0 10px rgba(var(--darkpurple-rgb), 0.6)",
                fontSize: sizes.playerName,
              }}
            >
              {wedgie.playerName}
            </h3>

            <p
              className="font-bold text-white"
              style={{ fontSize: sizes.teamName }}
            >
              <span className="text-pink">{wedgie.teamName}</span>{" "}
              {!wedgie.teamAgainstName.includes("Unknown")
                ? `- ${wedgie.teamAgainstName}`
                : ""}
              {showSeason && (
                <span className="vertical-text ml-2 align-baseline text-xs leading-none text-white/60">
                  {wedgie.seasonName}
                </span>
              )}
            </p>
            <p
              className="font-bold tracking-wide text-white/60 uppercase"
              style={{ fontSize: sizes.types }}
            >
              {wedgie.types
                .map((type: { name: string }) => type.name)
                .join(", ")}
            </p>
          </div>
          <div className="relative overflow-visible">
            <div
              className={`absolute top-1/2 right-2 -translate-y-1/2 overflow-visible ${variant === "small" ? "w-20 md:w-20" : "w-20 md:w-24"}`}
            >
              <CourtPositionDiagram
                position={wedgie.position}
                dotClassName="h-2 w-2 md:h-3 md:w-3"
              />
            </div>
          </div>
        </div>
      </button>

      <WedgieModal
        wedgie={wedgie}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPrevious={() => {
          if (previousWedgie && onWedgieClick) {
            onWedgieClick(previousWedgie);
          }
        }}
        onNext={() => {
          if (nextWedgie && onWedgieClick) {
            onWedgieClick(nextWedgie);
          }
        }}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </>
  );
}
