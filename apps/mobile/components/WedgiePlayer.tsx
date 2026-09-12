import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { getApiBaseUrl } from "@/lib/api";
import { report } from "@/lib/observability";
import { colors, space, type } from "@/lib/theme";
import type { VideoUrls } from "@wedgietracker/core/types/wedgie";
import {
  getVideoSrc,
  type ActiveVideo,
} from "@wedgietracker/core/utils/wedgieVideo";

/**
 * Every clip plays in its publisher's own embed. There is no native player
 * here any more, and no path that serves our Cloudinary copy of broadcast
 * footage, which is a better position for an app than for the website.
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

  return <EmbeddedVideo src={src} />;
}

/**
 * The app's source order, which is the website's minus Cloudinary.
 *
 * Three of 635 wedgies have only our own mp4. They deliberately show "no
 * video" rather than playing it: the app should never distribute a re-hosted
 * copy of a broadcast clip, and three missing clips is a smaller cost than
 * keeping that path open for them.
 */
export function pickVideoForApp(
  videoUrl: VideoUrls | null,
): ActiveVideo | null {
  if (videoUrl?.youtube) return "youtube";
  if (videoUrl?.youtubeNoDunks) return "youtubeNoDunks";
  if (videoUrl?.instagram) return "instagram";
  return null;
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
  // autoplay and mute keep the behaviour the native player had: you tapped a
  // clip, so it starts, and opening a wedgie never blares audio. YouTube
  // permits autoplay only while muted, so the two go together.
  const embedSrc = `${src}${separator}origin=${encodeURIComponent(origin)}&playsinline=1&autoplay=1&mute=1`;

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
        // YouTube reports its own 150/152/153 inside the iframe, so these only
        // catch the WebView failing outright. Still the difference between a
        // black frame and knowing why.
        onError={({ nativeEvent }) =>
          report("video.webview", new Error(nativeEvent.description), { src })
        }
        onHttpError={({ nativeEvent }) =>
          report("video.webview.http", new Error("http error"), {
            src,
            status: nativeEvent.statusCode,
          })
        }
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
