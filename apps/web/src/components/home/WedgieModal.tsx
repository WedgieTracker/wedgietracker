import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "~/components/ui/dialog";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { Wedgie, VideoUrls } from "@wedgietracker/core/types/wedgie";
import { useState } from "react";
import { ShareButtons } from "~/components/shared/ShareButtons";
import { WedgieVideoTabs } from "./WedgieVideoTabs";
import { CourtPositionDiagram } from "./CourtPositionDiagram";
import { WedgieInfoPanel } from "./WedgieInfoPanel";
import { WedgieModalNav } from "./WedgieModalNav";
import { NoDunksTweetLink } from "./NoDunksTweetLink";
import { ReportWedgieButton } from "./ReportWedgieButton";
import { buildShareParams, useCopyWedgieLink } from "./useCopyWedgieLink";
import {
  pickInitialVideo,
  getVideoSrc,
  type ActiveVideo,
} from "@wedgietracker/core/utils/wedgieVideo";

interface WedgieModalProps {
  wedgie: Wedgie & {
    types: { name: string }[];
    seasonNumber?: number;
    videoUrl: VideoUrls | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function WedgieModal({
  wedgie,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: WedgieModalProps) {
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(() =>
    pickInitialVideo(wedgie.videoUrl),
  );
  const handleCopyLink = useCopyWedgieLink(wedgie);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] gap-0 overflow-hidden overflow-y-auto rounded-xl border-none bg-transparent p-0 max-lg:mt-[4vh] max-lg:mb-auto sm:max-w-lg lg:max-w-7xl lg:p-2">
        <DialogClose className="focus:ring-none border-yellow bg-yellow text-darkpurple hover:bg-darkpurple hover:text-yellow absolute top-2 right-1 z-10 rounded-full border shadow-lg transition-all duration-300 hover:opacity-100 focus:ring-offset-0 focus:outline-hidden disabled:pointer-events-none sm:top-0 lg:top-1 lg:right-4">
          <Cross2Icon className="size-6 p-1 sm:h-8 sm:w-8" />
        </DialogClose>

        {/* Same height whether or not there are source tabs to show. */}
        <div className="min-h-10">
          {wedgie.videoUrl && (
            <WedgieVideoTabs
              videoUrl={wedgie.videoUrl}
              activeVideo={activeVideo}
              onChange={setActiveVideo}
            />
          )}
        </div>

        <DialogTitle className="sr-only">
          Wedgie by {wedgie.playerName} - {wedgie.teamName} vs{" "}
          {wedgie.teamAgainstName}
        </DialogTitle>

        <div className="border-darkpurple-lighter bg-darkpurple flex flex-col overflow-hidden rounded-xl lg:flex-row">
          <div
            className={`w-full lg:w-[65%] ${
              activeVideo === "instagram"
                ? "bg-darkpurple-darker aspect-video max-h-[80vh]"
                : "aspect-video"
            }`}
          >
            <div
              className={
                activeVideo === "instagram"
                  ? "mx-auto h-full w-full max-w-md overflow-y-auto rounded-xl py-4"
                  : "h-full w-full"
              }
            >
              {(!wedgie.videoUrl || activeVideo === "cloudinary") && (
                <div className="bg-darkpurple-darker flex h-full w-full items-center justify-center p-6 text-center text-sm font-bold tracking-wider text-white/60 uppercase">
                  Video not available at the moment
                </div>
              )}
              {wedgie.videoUrl && activeVideo !== "cloudinary" && (
                <iframe
                  title="Video player"
                  width="100%"
                  height="100%"
                  src={getVideoSrc(activeVideo, wedgie.videoUrl)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  {...(activeVideo === "instagram" && {
                    loading: "lazy",
                    scrolling: "yes",
                    style: {
                      border: "none",
                      overflow: "visible",
                      maxHeight: "80vh",
                    },
                  })}
                />
              )}
            </div>
          </div>

          {/* On desktop the row takes the video's height and the details scroll
              inside it, so the modal keeps one size from wedgie to wedgie. */}
          <div className="relative w-full lg:w-[35%]">
            <div className="lg:absolute lg:inset-0 lg:overflow-y-auto">
              <WedgieInfoPanel wedgie={wedgie} />
            </div>
            {/* Pinned to the bottom of the labels column, so it never covers
                the details beside it. */}
            <div className="pointer-events-none absolute bottom-6 left-8 hidden w-[70px] lg:block">
              <CourtPositionDiagram position={wedgie.position} />
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-row items-center justify-between pb-0.5">
          <div className="flex flex-row gap-1 sm:gap-2">
            {wedgie.noDunksTweet && (
              <NoDunksTweetLink tweetId={wedgie.noDunksTweet.id} />
            )}
            <button
              onClick={handleCopyLink}
              aria-label="Copy link"
              title="Copy link"
              className="bg-yellow text-darkpurple hover:bg-yellow/80 flex size-7 items-center justify-center rounded-md transition-all duration-300 sm:size-8"
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
            <ShareButtons
              url={`/all-wedgies?${buildShareParams(wedgie).toString()}`}
              title={`Check out this wedgie by ${wedgie.playerName} - ${wedgie.teamName} vs ${wedgie.teamAgainstName} on WedgieTracker!`}
            />
            <ReportWedgieButton wedgie={wedgie} />
          </div>

          <WedgieModalNav
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
