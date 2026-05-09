import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "~/components/ui/dialog";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { Wedgie, VideoUrls } from "~/types/wedgie";
import { useState } from "react";
import { ShareButtons } from "~/components/shared/ShareButtons";
import { WedgieVideoTabs } from "./WedgieVideoTabs";
import { WedgieInfoPanel } from "./WedgieInfoPanel";
import { WedgieModalNav } from "./WedgieModalNav";
import { buildShareParams, useCopyWedgieLink } from "./useCopyWedgieLink";
import {
  pickInitialVideo,
  getVideoSrc,
  type ActiveVideo,
} from "./wedgie-video";

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
      <DialogContent className="max-w-[90vw] gap-0 overflow-hidden overflow-y-auto rounded-xl border-none bg-transparent p-0 sm:max-w-lg lg:max-w-7xl lg:p-2">
        <DialogClose className="focus:ring-none border-yellow bg-yellow text-darkpurple hover:bg-darkpurple hover:text-yellow absolute top-2 right-1 z-10 rounded-full border shadow-lg transition-all duration-300 hover:opacity-100 focus:ring-offset-0 focus:outline-hidden disabled:pointer-events-none sm:top-0 lg:top-1 lg:right-4">
          <Cross2Icon className="size-6 p-1 sm:h-8 sm:w-8" />
        </DialogClose>

        {wedgie.videoUrl ? (
          <WedgieVideoTabs
            videoUrl={wedgie.videoUrl}
            activeVideo={activeVideo}
            onChange={setActiveVideo}
          />
        ) : (
          <div>No video</div>
        )}

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
              {wedgie.videoUrl && (
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

          <WedgieInfoPanel wedgie={wedgie} />
        </div>

        <div className="mt-2 flex flex-row items-center justify-between pb-0.5">
          <div className="flex flex-row gap-1 sm:gap-2">
            <button
              onClick={handleCopyLink}
              className="bg-yellow text-darkpurple hover:bg-yellow/80 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold uppercase transition-all duration-300 sm:px-3 sm:py-2"
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
              Copy Link
            </button>
            <ShareButtons
              url={`/all-wedgies?${buildShareParams(wedgie).toString()}`}
              title={`Check out this wedgie by ${wedgie.playerName} - ${wedgie.teamName} vs ${wedgie.teamAgainstName} on WedgieTracker!`}
            />
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
