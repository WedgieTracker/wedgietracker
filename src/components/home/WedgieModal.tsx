import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "~/components/ui/dialog";

import { Cross2Icon } from "@radix-ui/react-icons";
import type { Wedgie, VideoUrls } from "~/types/wedgie";
import { useState } from "react";
import { useToast } from "~/hooks/use-toast";
import { ShareButtons } from "~/components/shared/ShareButtons";

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
  const { toast } = useToast();
  const [activeVideo, setActiveVideo] = useState<
    "youtube" | "cloudinary" | "youtubeNoDunks" | "instagram" | null
  >(() => {
    if (wedgie.videoUrl?.youtube) return "youtube";
    if (wedgie.videoUrl?.cloudinary) return "cloudinary";
    if (wedgie.videoUrl?.youtubeNoDunks) return "youtubeNoDunks";
    if (wedgie.videoUrl?.instagram) return "instagram";
    return null;
  });

  const getVideoUrl = (url: string, type: "youtubeNoDunks" | "cloudinary") => {
    if (type === "youtubeNoDunks") {
      // Use RegExp.exec() instead of match
      const videoIdMatch =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/.exec(
          url,
        );
      const videoId = videoIdMatch?.[1];

      const timeMatch = /[?&](?:t|start)=(\d+)/.exec(url);
      const startTime = timeMatch?.[1] ?? "";

      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return startTime ? `${embedUrl}?start=${startTime}` : embedUrl;
    }
    return url;
  };

  const handleCopyLink = async () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      ws: wedgie.seasonName || "",
      wn: wedgie.number?.toString() || "",
    });

    const fullUrl = `${baseUrl}/all-wedgies?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link copied!",
        description: "The wedgie link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] gap-0 overflow-hidden overflow-y-auto rounded-xl border-none bg-transparent p-0 sm:max-w-lg lg:max-w-7xl lg:p-2">
        <DialogClose className="focus:ring-none border-yellow bg-yellow text-darkpurple hover:bg-darkpurple hover:text-yellow absolute top-2 right-1 z-10 rounded-full border shadow-lg transition-all duration-300 hover:opacity-100 focus:ring-offset-0 focus:outline-hidden disabled:pointer-events-none sm:top-0 lg:top-1 lg:right-4">
          <Cross2Icon className="h-6 w-6 p-1 sm:h-8 sm:w-8" />
        </DialogClose>

        {wedgie.videoUrl ? (
          <>
            <div className="relative flex justify-start gap-2 p-2 pt-4 pb-0">
              {(wedgie.videoUrl.youtube ?? wedgie.videoUrl.cloudinary) && (
                <button
                  className={`rounded-xl rounded-b-none px-2 py-1 text-xs font-black ${
                    activeVideo === "youtube" || activeVideo === "cloudinary"
                      ? "bg-yellow text-darkpurple"
                      : "bg-darkpurple-lighter hover:bg-yellow/20 text-white"
                  }`}
                  onClick={() =>
                    setActiveVideo(
                      wedgie.videoUrl?.youtube ? "youtube" : "cloudinary",
                    )
                  }
                >
                  NBA Broadcast
                </button>
              )}
              {wedgie.videoUrl.youtubeNoDunks && (
                <button
                  className={`rounded-xl rounded-b-none px-2 py-1 text-xs font-black ${
                    activeVideo === "youtubeNoDunks"
                      ? "bg-yellow text-darkpurple"
                      : "bg-darkpurple-lighter hover:bg-yellow/20 text-white"
                  }`}
                  onClick={() => setActiveVideo("youtubeNoDunks")}
                >
                  NoDunks
                </button>
              )}
              {/* {wedgie.videoUrl.instagram && (
                <button
                  className={`rounded-xl rounded-b-none px-4 py-1 text-sm font-black ${
                    activeVideo === "instagram"
                      ? "bg-yellow text-darkpurple"
                      : "bg-darkpurple-lighter text-white hover:bg-yellow/20"
                  }`}
                  onClick={() => setActiveVideo("instagram")}
                >
                  Instagram
                </button>
              )} */}
            </div>
          </>
        ) : (
          <div>No video</div>
        )}

        <DialogTitle className="sr-only">
          Wedgie by {wedgie.playerName} - {wedgie.teamName} vs{" "}
          {wedgie.teamAgainstName}
        </DialogTitle>

        <div className="border-darkpurple-lighter bg-darkpurple flex flex-col overflow-hidden rounded-xl lg:flex-row">
          {/* Video Section - Takes full width on mobile, left half on desktop */}
          <div
            className={`w-full lg:w-[65%] ${
              activeVideo === "instagram"
                ? "bg-darkpurple-darker aspect-video max-h-[80vh]" // Vertical video ratio with max height
                : "aspect-video" // Standard 16:9 ratio for other videos
            }`}
          >
            <div
              className={`${
                activeVideo === "instagram"
                  ? "mx-auto h-full w-full max-w-md overflow-y-auto rounded-xl py-4" // Enable scrolling for Instagram
                  : "h-full w-full"
              }`}
            >
              {wedgie.videoUrl && (
                <>
                  <iframe
                    title="Video player"
                    width="100%"
                    height="100%"
                    src={
                      activeVideo === "youtube"
                        ? getVideoUrl(
                            wedgie.videoUrl.youtube ?? "",
                            "youtubeNoDunks",
                          )
                        : activeVideo === "youtubeNoDunks"
                          ? getVideoUrl(
                              wedgie.videoUrl.youtubeNoDunks ?? "",
                              "youtubeNoDunks",
                            )
                          : activeVideo === "instagram"
                            ? `${wedgie.videoUrl.instagram}embed`
                            : wedgie.videoUrl.cloudinary
                    }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    {...(activeVideo === "instagram" && {
                      loading: "lazy",
                      scrolling: "yes", // Enable iframe scrolling
                      style: {
                        border: "none",
                        overflow: "visible",
                        maxHeight: "80vh",
                      },
                    })}
                  />
                </>
              )}
            </div>
          </div>

          {/* Info Section - Takes full width on mobile, right half on desktop */}
          <div className="relative flex w-full flex-col justify-between p-6 px-4 sm:px-6 md:p-8 lg:w-[35%]">
            {/* Top Info */}
            <div className="space-y-2 sm:space-y-6">
              <div className="sm:text-wedgie-number flex flex-row items-center justify-start gap-4 text-xl leading-none">
                <h2 className="bg-pink text-yellow mb-2 flex h-[70px] w-[70px] flex-row items-center justify-center rounded-xl px-4 py-2 text-[1.6em] font-black">
                  <span className="text-darkpurple mt-[.75em] text-[.5em]">
                    #
                  </span>
                  {wedgie.number ?? "1"}
                </h2>
                <div>
                  <p className="text-yellow text-[.9em] font-bold tracking-wider">
                    {new Date(wedgie.wedgieDate).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    }) === "01.01.70"
                      ? "💎💎💎"
                      : new Date(wedgie.wedgieDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                  </p>

                  {/* season  */}
                  {wedgie.seasonName && wedgie.seasonName !== "GEMS" && (
                    <p className="mt-[.5em] text-[.5em] tracking-wider text-white uppercase">
                      {wedgie.seasonName
                        ? `${wedgie.seasonName} Season`
                        : "Season"}
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

            {/* Court Position Diagram - Optional */}
            <div className="absolute right-1.5 bottom-16 w-full max-w-[80px] sm:relative sm:right-auto sm:bottom-auto sm:max-w-[150px]">
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
                className="bg-yellow absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg"
                style={{
                  left: `${(wedgie.position as { x: number; y: number }).x}%`,
                  top: `${(wedgie.position as { x: number; y: number }).y}%`,
                }}
              >
                <div className="border-darkpurple bg-yellow absolute top-1/2 left-1/2 h-[calc(100%-0.2rem)] w-[calc(100%-0.2rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-row items-center justify-between pb-0.5">
          <div className="flex flex-row gap-1 sm:gap-2">
            <button
              onClick={handleCopyLink}
              className="bg-yellow text-darkpurple hover:bg-yellow/80 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold uppercase transition-all duration-300 sm:px-3 sm:py-2"
            >
              <svg
                className="h-4 w-4"
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
            {/* Share on social media */}
            <ShareButtons
              url={`/all-wedgies?${new URLSearchParams({
                ws: wedgie.seasonName || "",
                wn: wedgie.number?.toString() || "",
              }).toString()}`}
              title={`Check out this wedgie by ${wedgie.playerName} - ${wedgie.teamName} vs ${wedgie.teamAgainstName} on WedgieTracker!`}
            />
          </div>

          <div className="flex flex-row gap-1 sm:gap-3">
            <button
              {...(hasPrevious ? { onClick: onPrevious } : {})}
              className={`border-yellow bg-darkpurple text-yellow hover:bg-yellow hover:text-darkpurple rounded-full border p-1 transition-all sm:p-2 ${
                !hasPrevious
                  ? "pointer-events-none cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              {...(hasNext ? { onClick: onNext } : {})}
              className={`border-yellow bg-darkpurple text-yellow hover:bg-yellow hover:text-darkpurple rounded-full border p-1 transition-all sm:p-2 ${
                !hasNext
                  ? "pointer-events-none cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
