import type { VideoType } from "./useStatsVideo";

interface StatsVideoResultProps {
  videoBlob: Blob;
  videoType: VideoType;
  onReset: () => void;
  onDownload: () => void;
}

export function StatsVideoResult({
  videoBlob,
  videoType,
  onReset,
  onDownload,
}: StatsVideoResultProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <video
        src={URL.createObjectURL(videoBlob)}
        controls
        className={`w-full rounded-lg ${
          videoType === "desktop" ? "aspect-video" : "max-h-[400px]"
        }`}
      >
        <track kind="captions" />
      </video>
      <div className="flex w-full flex-row gap-4">
        <button
          onClick={onReset}
          className="border-pink text-pink hover:bg-pink hover:text-darkpurple flex-1 rounded-full border-2 bg-transparent px-8 py-2 text-center font-bold tracking-wide uppercase transition-all duration-300"
        >
          Generate New
        </button>
        <button
          onClick={onDownload}
          className="border-yellow bg-yellow text-darkpurple hover:bg-darkpurple hover:text-yellow flex-1 rounded-full border-2 px-8 py-2 text-center font-black tracking-wide uppercase transition-all duration-300"
        >
          Download
        </button>
      </div>
    </div>
  );
}
