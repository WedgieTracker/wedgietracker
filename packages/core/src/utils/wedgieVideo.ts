import type { VideoUrls } from "@wedgietracker/core/types/wedgie";

export type ActiveVideo = "youtube" | "hosted" | "youtubeNoDunks" | "instagram";

/** Our own copy of the clip, if there is one. */
export function hostedVideo(
  videoUrl: VideoUrls | null | undefined,
): string | undefined {
  return videoUrl?.hosted || undefined;
}

export function pickInitialVideo(
  videoUrl: VideoUrls | null,
): ActiveVideo | null {
  if (videoUrl?.youtube) return "youtube";
  if (hostedVideo(videoUrl)) return "hosted";
  if (videoUrl?.youtubeNoDunks) return "youtubeNoDunks";
  if (videoUrl?.instagram) return "instagram";
  return null;
}

/** Undefined when no video id can be read, rather than an embed of "undefined". */
function toYoutubeEmbed(url: string): string | undefined {
  const videoIdMatch =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/.exec(
      url,
    );
  const videoId = videoIdMatch?.[1];
  if (!videoId) return undefined;

  const timeMatch = /[?&](?:t|start)=(\d+)/.exec(url);
  const startTime = timeMatch?.[1] ?? "";

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  return startTime ? `${embedUrl}?start=${startTime}` : embedUrl;
}

export function getVideoSrc(
  activeVideo: ActiveVideo | null,
  videoUrl: VideoUrls,
): string | undefined {
  switch (activeVideo) {
    case "youtube":
      return toYoutubeEmbed(videoUrl.youtube ?? "");
    case "youtubeNoDunks":
      return toYoutubeEmbed(videoUrl.youtubeNoDunks ?? "");
    case "instagram":
      return `${videoUrl.instagram}embed`;
    case "hosted":
      return hostedVideo(videoUrl);
    default:
      return undefined;
  }
}
