"use client";

import { useState } from "react";
import { WedgieModal } from "./WedgieModal";
import { CourtPositionDiagram } from "./CourtPositionDiagram";
import type { WedgieWithTypes } from "@wedgietracker/core/types/wedgie";
import { LocalDate } from "~/components/shared/LocalDate";
import { PlayButton } from "./PlayIcon";

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

  const opponent = wedgie.teamAgainstName.includes("Unknown")
    ? null
    : wedgie.teamAgainstName;

  return (
    <>
      <button
        type="button"
        className={`group bg-panel border-violet/20 hover:border-violet/45 focus-visible:outline-cream grid w-full grid-cols-[58px_minmax(0,1fr)_56px_30px] items-center gap-3 rounded-[20px] border py-3.5 pr-3.5 pl-[18px] text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 ${
          variant === "small" ? "min-h-20" : "min-h-[84px]"
        }`}
        onClick={() => {
          if (onWedgieClick) {
            onWedgieClick(wedgie);
          } else {
            setIsModalOpen(true);
          }
        }}
      >
        <span className="text-cream text-4xl leading-none font-black tracking-[-0.04em] whitespace-nowrap italic">
          <span className="mr-[0.06em] text-[0.42em] tracking-normal opacity-55">
            #
          </span>
          {wedgie.number ?? "1"}
          <LocalDate
            date={wedgie.wedgieDate}
            className="text-cream/50 mt-[5px] block text-[10.5px] font-bold tracking-normal whitespace-nowrap not-italic"
          />
        </span>

        <span className="relative z-[1] min-w-0">
          <span className="text-cream block text-[16.5px] leading-tight font-extrabold whitespace-nowrap [text-shadow:0_0_6px_hsl(var(--panel)),0_0_2px_hsl(var(--panel))]">
            {wedgie.playerName}
          </span>
          <span className="text-cream/80 mt-1 block text-[13.5px] font-bold whitespace-nowrap">
            <span className="text-violet font-black">{wedgie.teamName}</span>
            {opponent && ` vs ${opponent}`}
            {showSeason && (
              <span className="text-cream/50 ml-2 text-xs">
                {wedgie.seasonName}
              </span>
            )}
          </span>
          <span className="text-cream/50 mt-0.5 block truncate text-[12.5px] font-bold">
            {wedgie.types.map((type: { name: string }) => type.name).join(", ")}
          </span>
        </span>

        <span className="relative block w-14">
          <CourtPositionDiagram
            position={wedgie.position}
            dotClassName="size-[7px]"
          />
        </span>

        <PlayButton />
        <span className="sr-only">Watch wedgie {wedgie.number}</span>
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
