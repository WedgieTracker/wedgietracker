import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { getApiBaseUrl } from "@/lib/api";
import { colors, space, type } from "@/lib/theme";
import type { VideoUrls } from "@wedgietracker/core/types/wedgie";
import {
  getVideoSrc,
  pickInitialVideo,
  type ActiveVideo,
} from "@wedgietracker/core/utils/wedgieVideo";

/**
 * The web app renders every source in an <iframe>. On iOS we split them:
 * Cloudinary and self-hosted files are real mp4s, so they get a native player;
 * YouTube and Instagram only offer embeds, so those stay in a WebView.
 */
export function WedgiePlayer({
  videoUrl,
  active,
}: {
  videoUrl: VideoUrls | null;
  active: ActiveVideo | null;
}) {
  const src = active && videoUrl ? getVideoSrc(active, videoUrl) : undefined;

  if (!active || !src) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No video for this wedgie</Text>
      </View>
    );
  }

  if (active === "cloudinary") {
    return <NativeVideo uri={src} />;
  }

  return <EmbeddedVideo src={src} />;
}

/**
 * Unlike the web app, prefer the Cloudinary mp4 over the YouTube embed: it
 * plays in the native player with real controls and picture-in-picture, and
 * avoids the WebView entirely. Falls back to the shared web ordering when
 * there is no mp4.
 */
export function pickVideoForNative(
  videoUrl: VideoUrls | null,
): ActiveVideo | null {
  if (videoUrl?.cloudinary) return "cloudinary";
  return pickInitialVideo(videoUrl);
}

function NativeVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    // Muted so opening a wedgie never blares audio, and playing straight away:
    // you tapped a clip, and a paused player just sits there showing its
    // controls over the frame. The controls are still there to unmute.
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.frame}>
      <VideoView
        player={player}
        style={styles.surface}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        contentFit="contain"
      />
    </View>
  );
}

/**
 * YouTube refuses to play an embed that has no legitimate page origin - "Error
 * 153" with none at all, "Error 152" when the origin is not one the video
 * allows. The site embeds these clips successfully, so present the site as the
 * embedding page: the document is served under its origin and passes the same
 * `origin` parameter a browser would.
 */
function EmbeddedVideo({ src }: { src: string }) {
  const origin = getApiBaseUrl();
  const separator = src.includes("?") ? "&" : "?";
  const embedSrc = `${src}${separator}origin=${encodeURIComponent(origin)}&playsinline=1`;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body { margin: 0; height: 100%; background: #000; }
      iframe { display: block; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe
      src="${embedSrc}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>
  </body>
</html>`;

  return (
    <View style={styles.frame}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: origin }}
        style={styles.surface}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        // The iframe fills the frame, so let the surrounding ScrollView keep
        // control of vertical drags.
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  surface: { flex: 1, backgroundColor: "#000" },
  placeholder: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.darkpurpleLight,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
  },
  placeholderText: { ...type.body, color: colors.muted },
});
