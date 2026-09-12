import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, space } from "@/lib/theme";
import type { VideoUrls } from "@wedgietracker/core/types/wedgie";
import type { ActiveVideo } from "@wedgietracker/core/utils/wedgieVideo";

/**
 * Port of apps/web/src/components/home/WedgieVideoTabs.tsx - switch between the
 * broadcast clip and the NoDunks cut.
 *
 * The broadcast tab resolves to the Cloudinary mp4 when there is one, since
 * that plays in the native player rather than a WebView.
 */
export function WedgieVideoTabs({
  videoUrl,
  activeVideo,
  onChange,
}: {
  videoUrl: VideoUrls;
  activeVideo: ActiveVideo | null;
  onChange: (next: ActiveVideo) => void;
}) {
  const hasBroadcast = Boolean(videoUrl.cloudinary ?? videoUrl.youtube);
  const broadcastActive =
    activeVideo === "youtube" || activeVideo === "cloudinary";

  if (!hasBroadcast && !videoUrl.youtubeNoDunks) return null;

  return (
    <View style={styles.tabs}>
      {hasBroadcast ? (
        <Tab
          label="NBA Broadcast"
          active={broadcastActive}
          onPress={() =>
            onChange(videoUrl.cloudinary ? "cloudinary" : "youtube")
          }
        />
      ) : null}

      {videoUrl.youtubeNoDunks ? (
        <Tab
          label="NoDunks"
          active={activeVideo === "youtubeNoDunks"}
          onPress={() => onChange("youtubeNoDunks")}
        />
      ) : null}
    </View>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}
    >
      <Text
        style={[styles.tabText, active && styles.tabTextActive]}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: space.sm },
  tab: {
    paddingHorizontal: space.sm,
    paddingVertical: 5,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.yellow },
  tabIdle: { backgroundColor: colors.darkpurpleLighter },
  tabText: { fontFamily: fonts.black, color: colors.white, fontSize: 12 },
  tabTextActive: { color: colors.darkpurple },
});
