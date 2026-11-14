"use client";

import { MonitorDown, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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

const DESCRIPTION_ID = "stats-video-description";

export function ShareableStatsVideo({ stats }: ShareableStatsVideoProps) {
  const { format, setFormat, status, generate, cancel, reset } =
    useStatsVideo(stats);
  const rendering = status.kind === "rendering";

  return (
    <Dialog
      onOpenChange={(open) => {
        // Closing the dialog stops a render; a finished video is kept.
        if (!open && rendering) cancel();
      }}
    >
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Make a video of these stats"
                className="border-cream/30 bg-night/35 text-cream hover:bg-cream hover:text-night focus-visible:outline-cream absolute right-4 bottom-4 z-10 hidden size-10 place-items-center rounded-full border opacity-70 transition-all duration-300 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 md:grid"
              >
                <MonitorDown className="size-5" aria-hidden="true" />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Make a video</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent
        aria-describedby={DESCRIPTION_ID}
        className="border-violet/30 bg-night rounded-[24px] p-0 sm:max-w-[560px] sm:rounded-[24px]"
        onInteractOutside={(e) => {
          // A stray click outside should not throw away a render in progress.
          if (rendering) e.preventDefault();
        }}
      >
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-cream text-2xl font-black tracking-tight italic">
                Share the stats
              </DialogTitle>
              <p
                id={DESCRIPTION_ID}
                className="text-cream/70 mt-1.5 text-sm font-semibold"
              >
                A 10-second video of this season&apos;s numbers, made in your
                browser.
              </p>
            </div>
            <DialogClose
              className="text-cream/70 hover:text-cream hover:bg-panel focus-visible:outline-cream -mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-2"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogClose>
          </div>

          {(status.kind === "idle" || status.kind === "error") && (
            <>
              <StatsVideoFormatToggle value={format} onChange={setFormat} />
              {status.kind === "error" && (
                <p
                  role="alert"
                  className="rounded-[14px] border border-[#ff4fc8]/40 bg-[#ff4fc8]/10 px-4 py-3 text-sm font-bold text-[#ffb3e6]"
                >
                  {status.message}
                </p>
              )}
              <button
                type="button"
                onClick={generate}
                className="btn-sticker text-button-text w-full px-8 uppercase"
              >
                {status.kind === "error" ? "Try again" : "Make the video"}
              </button>
            </>
          )}

          {status.kind === "rendering" && (
            <div className="flex flex-col gap-4">
              <div
                role="progressbar"
                aria-label="Making the video"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(status.progress * 100)}
                className="bg-panel border-violet/20 h-4 w-full overflow-hidden rounded-full border"
              >
                <div
                  className="bg-glow-x h-full rounded-full transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.max(status.progress * 100, 2)}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-cream text-sm font-bold" aria-live="polite">
                  Making your video… {Math.round(status.progress * 100)}%
                </p>
                <button
                  type="button"
                  onClick={cancel}
                  className="text-cream/80 hover:text-cream focus-visible:outline-cream rounded-full px-3 py-1.5 text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status.kind === "done" && (
            <StatsVideoResult video={status.video} onReset={reset} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
