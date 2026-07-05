import type { VideoUrls } from "~/types/wedgie";

export type ActiveVideo =
  "youtube" | "cloudinary" | "youtubeNoDunks" | "instagram";

export function pickInitialVideo(
  videoUrl: VideoUrls | null,
): ActiveVideo | null {
  if (videoUrl?.youtube) return "youtube";
  if (videoUrl?.cloudinary) return "cloudinary";
  if (videoUrl?.youtubeNoDunks) return "youtubeNoDunks";
  if (videoUrl?.instagram) return "instagram";
  return null;
}

function toYoutubeEmbed(url: string): string {
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
    case "cloudinary":
      return videoUrl.cloudinary;
    default:
      return undefined;
  }
}
