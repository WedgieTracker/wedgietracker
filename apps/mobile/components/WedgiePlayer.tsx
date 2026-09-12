import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import Svg, { Path } from "react-native-svg";

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
 * plays in the native player and avoids the WebView entirely. Falls back to
 * the shared web ordering when there is no mp4.
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
    // you tapped a clip, so start it.
    p.muted = true;
    p.play();
  });

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    if (playing) player.pause();
    else player.play();
    setPlaying(!playing);
  };

  const toggleMute = () => {
    const next = !muted;
    player.muted = next;
    setMuted(next);
  };

  return (
    <View style={styles.frame}>
      <VideoView
        player={player}
        style={styles.surface}
        // expo-video's own controls render as blank capsules here - the chrome
        // draws but its icons never do. These clips are a few seconds long and
        // loop, so a scrubber, PiP and AirPlay were never the point: play,
        // pause and sound are.
        nativeControls={false}
        contentFit="contain"
      />

      {/* The whole frame is the play/pause target. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={togglePlay}>
        {!playing ? (
          <View style={styles.playOverlay}>
            <View style={styles.playBadge}>
              <Svg width={30} height={30} viewBox="0 0 24 24">
                <Path d="M8 5v14l11-7z" fill={colors.darkpurple} />
              </Svg>
            </View>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        onPress={toggleMute}
        hitSlop={12}
        style={({ pressed }) => [styles.soundButton, pressed && styles.pressed]}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path d={SPEAKER_BODY} fill={colors.darkpurple} />
          {muted ? (
            <Path
              d="M17 9l4 4M21 9l-4 4"
              stroke={colors.darkpurple}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : (
            <Path
              d={SPEAKER_WAVES}
              stroke={colors.darkpurple}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </Svg>
      </Pressable>
    </View>
  );
}

const SPEAKER_BODY = "M4 9v6h3l5 4V5L7 9H4z";
const SPEAKER_WAVES = "M16 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12";

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
  playOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    // nudged right so the triangle looks centred
    paddingLeft: 4,
  },
  soundButton: {
    position: "absolute",
    right: space.md,
    bottom: space.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
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
