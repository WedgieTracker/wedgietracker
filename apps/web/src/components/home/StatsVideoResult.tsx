import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { VIDEO_FORMATS, formatBytes } from "./stats-video-helpers";
import {
  type StatsVideo,
  canShareVideo,
  downloadVideo,
  shareVideo,
} from "./useStatsVideo";

interface StatsVideoResultProps {
  video: StatsVideo;
  onReset: () => void;
}

export function StatsVideoResult({ video, onReset }: StatsVideoResultProps) {
  const [canShare, setCanShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const { width, height } = VIDEO_FORMATS[video.format];
  const isWebm = video.blob.type.includes("webm");

  // Only known in the browser, so it is checked after mount.
  useEffect(() => setCanShare(canShareVideo(video)), [video]);

  return (
    <div className="flex flex-col gap-4">
      <video
        src={video.url}
        autoPlay
        muted
        loop
        playsInline
        controls
        aria-label="Preview of the stats video"
        className={`border-violet/20 bg-panel mx-auto rounded-[16px] border ${
          video.format === "landscape"
            ? "aspect-video w-full"
            : "aspect-[9/16] max-h-[52vh]"
        }`}
      />
      <p className="text-cream/70 text-center text-xs font-bold" role="status">
        Ready: {isWebm ? "WebM" : "MP4"} · {width}×{height} ·{" "}
        {formatBytes(video.blob.size)} · made in{" "}
        {(video.renderMs / 1000).toFixed(1)}s
      </p>
      {isWebm && (
        <p className="text-cream/80 rounded-[14px] border border-[#ff4fc8]/40 bg-[#ff4fc8]/10 px-4 py-3 text-sm font-semibold">
          This browser could only make a WebM, which Instagram and iPhones
          won&apos;t take. For an MP4, use the latest Chrome, Edge or Safari.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => downloadVideo(video)}
          className="btn-sticker text-button-text flex-1 gap-2 px-6 uppercase"
        >
          <Download className="size-5" aria-hidden="true" />
          Download
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => {
              setShareError(null);
              shareVideo(video).catch(() =>
                setShareError("Sharing didn't work here. Download it instead."),
              );
            }}
            className="btn-sticker btn-sticker-flat text-button-text flex-1 gap-2 px-6 uppercase"
          >
            <Share2 className="size-5" aria-hidden="true" />
            Share
          </button>
        )}
      </div>
      {shareError && (
        <p role="alert" className="text-sm font-bold text-[#ffb3e6]">
          {shareError}
        </p>
      )}
      <button
        type="button"
        onClick={onReset}
        className="text-cream/80 hover:text-cream focus-visible:outline-cream self-center rounded-full px-3 py-1.5 text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2"
      >
        Make another
      </button>
    </div>
  );
}
