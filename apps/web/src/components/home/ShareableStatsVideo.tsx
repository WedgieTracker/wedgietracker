"use client";

import { Loader } from "../shared/Loader";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "~/components/ui/dialog";
import { MonitorDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { ShareableStats } from "./stats-video-helpers";
import { useStatsVideo } from "./useStatsVideo";
import { StatsVideoFormatToggle } from "./StatsVideoFormatToggle";
import { StatsVideoResult } from "./StatsVideoResult";

interface ShareableStatsVideoProps {
  stats: ShareableStats;
}

export function ShareableStatsVideo({ stats }: ShareableStatsVideoProps) {
  const {
    canvasRef,
    isGenerating,
    videoBlob,
    progress,
    videoType,
    setVideoType,
    generateVideo,
    handleDownload,
    reset,
  } = useStatsVideo(stats);

  return (
    <Dialog>
      <DialogTrigger>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="border-pink bg-pink text-darkpurple hover:bg-darkpurple hover:text-pink absolute right-4 bottom-4 z-10 hidden size-10 rounded-full border-2 p-2 text-center font-bold opacity-30 transition-all duration-300 hover:opacity-100 md:block">
                <MonitorDown className="size-5" />
                <span className="sr-only">Share Stats Video</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate a video</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="border-darkpurple-lighter bg-darkpurple sm:max-w-[600px]">
        <DialogTitle className="sr-only">Share Stats Video</DialogTitle>
        <div className="flex flex-col items-center gap-4 p-6">
          <canvas ref={canvasRef} className="hidden" />

          {!videoBlob && (
            <>
              <button
                onClick={generateVideo}
                disabled={isGenerating}
                className="group border-yellow bg-yellow text-darkpurple hover:bg-darkpurple hover:text-yellow flex w-full flex-row items-center justify-center gap-2 rounded-full border-2 px-8 py-2 text-center text-xl font-bold uppercase transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "Generating Video..." : "Generate Video"}
                <span className="border-darkpurple bg-darkpurple text-yellow group-hover:bg-yellow group-hover:text-darkpurple rounded-full border-2 px-2 py-0.5 text-xs transition-all duration-300">
                  Beta
                </span>
              </button>
              {!isGenerating && (
                <StatsVideoFormatToggle
                  value={videoType}
                  onChange={setVideoType}
                />
              )}
            </>
          )}

          {isGenerating && (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="-mr-8 -mb-2 w-full max-w-24">
                  <Loader />
                </div>
              </div>
              <div className="bg-darkpurple-lighter relative h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-pink absolute top-0 left-0 h-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="text-center text-sm text-white/60">
                {Math.round(progress * 100)}%
              </div>
            </div>
          )}

          {videoBlob && (
            <StatsVideoResult
              videoBlob={videoBlob}
              videoType={videoType}
              onReset={reset}
              onDownload={handleDownload}
            />
          )}

          <div className="mt-2 text-center text-sm text-white/60">
            Generate a video of the current stats to share on social media.{" "}
            <br />
            If the result doesn&apos;t look good, try generating a new video.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
