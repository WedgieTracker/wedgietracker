import type { VideoUrls } from "~/types/wedgie";
import type { ActiveVideo } from "./wedgie-video";

interface WedgieVideoTabsProps {
  videoUrl: VideoUrls;
  activeVideo: ActiveVideo | null;
  onChange: (next: ActiveVideo) => void;
}

const tabClass = (active: boolean) =>
  `rounded-xl rounded-b-none px-2 py-1 text-xs font-black ${
    active
      ? "bg-yellow text-darkpurple"
      : "bg-darkpurple-lighter hover:bg-yellow/20 text-white"
  }`;

export function WedgieVideoTabs({
  videoUrl,
  activeVideo,
  onChange,
}: WedgieVideoTabsProps) {
  const hasBroadcast = Boolean(videoUrl.youtube ?? videoUrl.cloudinary);
  const broadcastActive =
    activeVideo === "youtube" || activeVideo === "cloudinary";

  return (
    <div className="relative flex justify-start gap-2 p-2 pt-4 pb-0">
      {hasBroadcast && (
        <button
          className={tabClass(broadcastActive)}
          onClick={() => onChange(videoUrl.youtube ? "youtube" : "cloudinary")}
        >
          NBA Broadcast
        </button>
      )}
      {videoUrl.youtubeNoDunks && (
        <button
          className={tabClass(activeVideo === "youtubeNoDunks")}
          onClick={() => onChange("youtubeNoDunks")}
        >
          NoDunks
        </button>
      )}
    </div>
  );
}
