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
  const active: ActiveVideo | null = pickInitialVideo(videoUrl);

  if (!videoUrl || !active) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No video for this wedgie</Text>
      </View>
    );
  }

  const src = getVideoSrc(active, videoUrl);
  if (!src) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No video for this wedgie</Text>
      </View>
    );
  }

  if (active === "cloudinary") {
    return <NativeVideo uri={src} />;
  }

  return (
    <View style={styles.frame}>
      <WebView
        source={{ uri: src }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Embeds size themselves; stop the WebView stealing vertical drags
        // from the surrounding ScrollView.
        nestedScrollEnabled={false}
        scrollEnabled={false}
      />
    </View>
  );
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
        style={styles.webview}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  webview: { flex: 1, backgroundColor: "#000" },
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
