import type { VideoUrls } from "@wedgietracker/core/types/wedgie";
import {
  getVideoSrc,
  type ActiveVideo,
} from "@wedgietracker/core/utils/wedgieVideo";

interface WedgieVideoFrameProps {
  videoUrl: VideoUrls | null;
  activeVideo: ActiveVideo | null;
  className?: string;
}

/** The chosen clip in a 16:9 frame, shared by the wedgie modal and the wedgie page. */
export function WedgieVideoFrame({
  videoUrl,
  activeVideo,
  className = "",
}: WedgieVideoFrameProps) {
  return (
    <div
      className={`${className} ${
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
        {(!videoUrl || activeVideo === "hosted") && (
          <div className="bg-darkpurple-darker flex h-full w-full items-center justify-center p-6 text-center text-sm font-bold tracking-wider text-white/60 uppercase">
            Video not available at the moment
          </div>
        )}
        {videoUrl && activeVideo !== "hosted" && (
          <iframe
            title="Video player"
            width="100%"
            height="100%"
            src={getVideoSrc(activeVideo, videoUrl)}
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
  );
}
