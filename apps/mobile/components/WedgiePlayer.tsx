import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import Svg, { Path } from "react-native-svg";

import { getApiBaseUrl } from "@/lib/api";
import { report } from "@/lib/observability";
import { colors, space, type } from "@/lib/theme";
import type { VideoUrls } from "@wedgietracker/core/types/wedgie";
import {
  getVideoSrc,
  type ActiveVideo,
} from "@wedgietracker/core/utils/wedgieVideo";

/**
 * Sources are picked by the shared `pickInitialVideo`, exactly as the website
 * picks them, which means YouTube first. Only 3 of 635 wedgies have no YouTube
 * URL, so the native mp4 player below is now the rare path rather than the
 * common one.
 *
 * That is deliberate. Playing a broadcast clip through YouTube's own embed
 * leaves it with the rights holder's player rather than serving our re-hosted
 * copy of it, which matters more for an app than it does for the site.
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

  // A clip that will not load shows a black frame and says nothing. Without
  // this, a dead Cloudinary asset is invisible until somebody complains.
  useEffect(() => {
    const sub = player.addListener("statusChange", ({ status, error }) => {
      if (status !== "error") return;
      report("video.native", error ?? new Error("player error"), { uri });
    });
    return () => sub.remove();
  }, [player, uri]);

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
                <Path d={PLAY_TRIANGLE} fill={colors.darkpurple} />
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

/**
 * Sized so the triangle's centroid lands on the viewBox centre (2a + b = 36
 * for a shape 10 wide). A play glyph centred on its bounding box reads as
 * sitting too far left, which is why this is solved rather than eyeballed -
 * and why the badge needs no nudge of its own.
 */
const PLAY_TRIANGLE = "M8.67 6v12l10-6z";

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
  // autoplay and mute keep the behaviour the Cloudinary player had: you tapped
  // a clip, so it starts, and opening a wedgie never blares audio. YouTube
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
        // YouTube answers an embed it will not play with an error code inside
        // the iframe rather than a failed request, so these two catch the
        // WebView failing outright; the player's own 150/152/153 do not reach
        // us here.
        onError={({ nativeEvent }) =>
          report("video.webview", new Error(nativeEvent.description), { src })
        }
        onHttpError={({ nativeEvent }) =>
          report("video.webview.http", new Error("http error"), {
            src,
            status: nativeEvent.statusCode,
          })
        }
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
