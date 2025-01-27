"use client";

import { useState } from "react";
import { WedgieModal } from "./WedgieModal";
import type { WedgieWithTypes } from "~/types/wedgie";

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
      <div
        key={wedgie.id}
        className={`group mb-2 flex cursor-pointer items-center justify-between overflow-hidden bg-darkpurple-light/30 transition-all duration-300 hover:bg-darkpurple-light/80 ${
          variant === "small"
            ? "!last:pb-0 !mb-0 rounded-xl !border-0 !pb-0"
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
            className={`flex flex-col items-center overflow-hidden border border-darkpurple bg-pink transition-all duration-300 group-hover:border-yellow group-hover:bg-darkpurple/80 ${
              variant === "small"
                ? "rounded-xl lg:min-h-20 lg:min-w-20"
                : "min-w-[74px] rounded-sm group-first:rounded-tl-xl group-last:rounded-bl-xl lg:min-h-24 lg:min-w-24"
            }`}
          >
            <div className="mt-1">
              <span
                className="mr-[-0.2rem] font-bold leading-none text-darkpurple/50 transition-all duration-300 group-hover:text-yellow"
                style={{ fontSize: sizes.hash }}
              >
                #
              </span>
              <span
                className="min-w-15 font-black leading-none text-yellow"
                style={{ fontSize: sizes.number }}
              >
                {wedgie.number ?? "1"}
              </span>
            </div>
            <div
              className={`mb-2 font-black leading-none tracking-wide text-darkpurple transition-all duration-300 group-hover:text-yellow ${sizes.date}`}
              style={{ fontSize: sizes.date }}
            >
              {new Date(wedgie.wedgieDate).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              }) === "01.01.70"
                ? "💎💎💎"
                : new Date(wedgie.wedgieDate).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
            </div>
            <div
              className="w-full rounded-b-[0.125rem] border-t border-yellow bg-yellow px-3 py-0.5 text-center font-bold text-darkpurple transition-all duration-300 group-last:rounded-bl-xl group-hover:border-t-yellow group-hover:bg-transparent group-hover:text-yellow"
              style={{ fontSize: sizes.watch }}
            >
              WATCH
            </div>
          </div>
          <div className="min-w-0">
            <h3
              className="shadow-lg-darkpurple mb-1 truncate font-bold leading-none text-yellow"
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
              className="font-bold uppercase tracking-wide text-white/60"
              style={{ fontSize: sizes.types }}
            >
              {wedgie.types
                .map((type: { name: string }) => type.name)
                .join(", ")}
            </p>
          </div>
          <div className="relative overflow-visible">
            <div
              className={`absolute right-2 top-1/2 -translate-y-1/2 overflow-visible ${variant === "small" ? "w-20 md:w-20" : "w-20 md:w-24"}`}
            >
              <div
                style={{
                  position: "relative",
                  top: "0",
                  left: "0",
                  width: "100%",
                  paddingBottom: "73.3%",
                }}
              ></div>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundImage: `url(https://res.cloudinary.com/wedgietracker/image/upload/v1735557904/assets/court_aazejm.svg)`,
                  backgroundSize: "contain",
                  backgroundPosition: "center center",
                  backgroundRepeat: "no-repeat",
                }}
              ></div>
              <div
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow shadow-lg md:h-3 md:w-3"
                style={{
                  left: `${(wedgie.position as { x: number; y: number }).x}%`,
                  top: `${(wedgie.position as { x: number; y: number }).y}%`,
                }}
              >
                <div className="absolute left-1/2 top-1/2 h-[calc(100%-0.2rem)] w-[calc(100%-0.2rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-darkpurple bg-yellow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
