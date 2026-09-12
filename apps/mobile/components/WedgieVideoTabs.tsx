import { Pressable, StyleSheet, Text, View } from "react-native";

import { track } from "@/lib/observability";
import { colors, fonts, radius, space } from "@/lib/theme";
import type { VideoUrls } from "@wedgietracker/core/types/wedgie";
import type { ActiveVideo } from "@wedgietracker/core/utils/wedgieVideo";

/**
 * Port of apps/web/src/components/home/WedgieVideoTabs.tsx - switch between the
 * broadcast clip and the NoDunks cut.
 *
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
  const switchTo = (next: ActiveVideo) => {
    track("wt_video_source_switched", { from: activeVideo, to: next });
    onChange(next);
  };

  const hasBroadcast = Boolean(videoUrl.youtube);
  const hasNoDunks = Boolean(videoUrl.youtubeNoDunks);
  const broadcastActive = activeVideo === "youtube";

  // Nothing to switch between, so the tab is just a label taking up space.
  if (!hasBroadcast || !hasNoDunks) return null;

  return (
    <View style={styles.tabs}>
      {hasBroadcast ? (
        <Tab
          label="Clip"
          active={broadcastActive}
          onPress={() => switchTo("youtube")}
        />
      ) : null}

      <Tab
        label="NoDunks"
        active={activeVideo === "youtubeNoDunks"}
        onPress={() => switchTo("youtubeNoDunks")}
      />
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
  // Indented so the tabs sit over the video's rounded top corner rather than
  // hanging off its left edge.
  tabs: { flexDirection: "row", gap: space.sm, paddingLeft: space.md },
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
