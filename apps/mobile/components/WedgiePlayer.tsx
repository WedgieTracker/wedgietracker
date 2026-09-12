import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors, radius, space, type } from "@/lib/theme";
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
export function WedgiePlayer({ videoUrl }: { videoUrl: VideoUrls | null }) {
  const active = pickVideoForNative(videoUrl);
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
function pickVideoForNative(videoUrl: VideoUrls | null): ActiveVideo | null {
  if (videoUrl?.cloudinary) return "cloudinary";
  return pickInitialVideo(videoUrl);
}

function NativeVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
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
 * Loading an embed URL straight into a WebView makes YouTube reject playback
 * with "Error 153" - the embed needs a real page origin. Wrapping it in a
 * document with a matching `baseUrl` gives it one.
 */
function EmbeddedVideo({ src }: { src: string }) {
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
      src="${src}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>
  </body>
</html>`;

  return (
    <View style={styles.frame}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: originOf(src) }}
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

function originOf(url: string): string {
  const match = /^(https?:\/\/[^/]+)/.exec(url);
  return match?.[1] ?? "https://www.youtube.com";
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  surface: { flex: 1, backgroundColor: "#000" },
  placeholder: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    backgroundColor: colors.darkpurpleLight,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
  },
  placeholderText: { ...type.body, color: colors.muted },
});
