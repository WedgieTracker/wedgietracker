import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { CourtPositionDiagram } from "@/components/CourtPositionDiagram";
import { ErrorState, Loading } from "@/components/States";
import { WedgiePlayer, pickVideoForNative } from "@/components/WedgiePlayer";
import { WedgieVideoTabs } from "@/components/WedgieVideoTabs";
import { api, getApiBaseUrl, type RouterOutputs } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";
import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";
import type { ActiveVideo } from "@wedgietracker/core/utils/wedgieVideo";

type Wedgie = RouterOutputs["wedgie"]["getAll"][number];

/**
 * Port of apps/web/src/components/home/WedgieModal.tsx and WedgieInfoPanel.
 */
export default function WedgieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Reads the full list, not the latest feed: anything opened from All Wedgies
  // is usually older than the thirteen most recent.
  const all = api.wedgie.getAll.useQuery();

  const ordered = useMemo(() => {
    if (!all.data) return [];
    return [...all.data].sort(
      (a, b) =>
        new Date(b.wedgieDate).getTime() - new Date(a.wedgieDate).getTime(),
    );
  }, [all.data]);

  const index = ordered.findIndex((w) => String(w.id) === id);
  const wedgie = index >= 0 ? ordered[index] : undefined;

  if (all.isPending) return <Loading label="Loading wedgie" />;

  if (all.error) {
    return (
      <View style={styles.padded}>
        <ErrorState message={all.error.message} />
      </View>
    );
  }

  if (!wedgie) {
    return (
      <View style={styles.padded}>
        <ErrorState message="That wedgie could not be found." />
      </View>
    );
  }

  return (
    <WedgieDetail
      wedgie={wedgie}
      hasPrevious={index > 0}
      hasNext={index < ordered.length - 1}
      onPrevious={() => {
        const prev = ordered[index - 1];
        if (prev) router.setParams({ id: String(prev.id) });
      }}
      onNext={() => {
        const next = ordered[index + 1];
        if (next) router.setParams({ id: String(next.id) });
      }}
    />
  );
}

function WedgieDetail({
  wedgie,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: {
  wedgie: Wedgie;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const [active, setActive] = useState<ActiveVideo | null>(() =>
    pickVideoForNative(wedgie.videoUrl),
  );
  const [copied, setCopied] = useState(false);

  // Reset the chosen source when stepping to another wedgie.
  useEffect(() => {
    setActive(pickVideoForNative(wedgie.videoUrl));
  }, [wedgie.id, wedgie.videoUrl]);

  const shareUrl = `${getApiBaseUrl()}/all-wedgies?ws=${encodeURIComponent(
    wedgie.seasonName ?? "",
  )}&wn=${wedgie.number ?? ""}`;

  const onCopy = async () => {
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onShare = () =>
    Share.share({
      message: `Check out this wedgie by ${wedgie.playerName} - ${wedgie.teamName} vs ${wedgie.teamAgainstName} on WedgieTracker! ${shareUrl}`,
      url: shareUrl,
    });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {wedgie.videoUrl ? (
        <WedgieVideoTabs
          videoUrl={wedgie.videoUrl}
          activeVideo={active}
          onChange={setActive}
        />
      ) : null}

      <WedgiePlayer videoUrl={wedgie.videoUrl} active={active} />

      {/* Number badge beside the date and season, as the info panel has it. */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeHash} allowFontScaling={false}>
            #
          </Text>
          <Text style={styles.badgeNumber} allowFontScaling={false}>
            {wedgie.number ?? 1}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.date} allowFontScaling={false}>
            {formatDate(wedgie.wedgieDate)}
          </Text>
          {wedgie.seasonName && wedgie.seasonName !== "GEMS" ? (
            <Text style={styles.season} allowFontScaling={false}>
              {wedgie.seasonName} SEASON
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.facts}>
        <Fact label="Player">
          <Text style={styles.player}>{wedgie.playerName}</Text>
        </Fact>
        <Fact label="Teams">
          <Text style={styles.teams}>
            <Text style={styles.teamName}>{wedgie.teamName}</Text>
            {wedgie.teamAgainstName.includes("Unknown")
              ? ""
              : ` vs ${wedgie.teamAgainstName}`}
          </Text>
        </Fact>
        {wedgie.types.length > 0 ? (
          <Fact label="Type">
            <Text style={styles.types}>
              {wedgie.types.map((t) => t.name).join(", ")}
            </Text>
          </Fact>
        ) : null}
      </View>

      <View style={styles.courtWrap}>
        <CourtPositionDiagram
          position={wedgie.position}
          width={150}
          dotSize={14}
        />
      </View>

      <View style={styles.actions}>
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => void onCopy()}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText} allowFontScaling={false}>
              {copied ? "COPIED!" : "COPY LINK"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void onShare()}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText} allowFontScaling={false}>
              SHARE
            </Text>
          </Pressable>
        </View>

        <View style={styles.nav}>
          <NavArrow
            direction="previous"
            enabled={hasPrevious}
            onPress={onPrevious}
          />
          <NavArrow direction="next" enabled={hasNext} onPress={onNext} />
        </View>
      </View>
    </ScrollView>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel} allowFontScaling={false}>
        {label.toUpperCase()}
      </Text>
      <View style={styles.factValue}>{children}</View>
    </View>
  );
}

const PREVIOUS_PATH = "M15 19l-7-7 7-7";
const NEXT_PATH = "M9 5l7 7-7 7";

function NavArrow({
  direction,
  enabled,
  onPress,
}: {
  direction: "previous" | "next";
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={enabled ? onPress : undefined}
      disabled={!enabled}
      style={({ pressed }) => [
        styles.navArrow,
        !enabled && styles.navArrowDisabled,
        pressed && enabled && styles.navArrowPressed,
      ]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d={direction === "previous" ? PREVIOUS_PATH : NEXT_PATH}
          stroke={colors.yellow}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

/** The info panel shows a long en-US date, or the GEMS emoji on those days. */
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (isGemsDate(date)) return GEMS_EMOJI;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkpurple },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  padded: { flex: 1, padding: space.lg, backgroundColor: colors.darkpurple },

  headerRow: { flexDirection: "row", alignItems: "center", gap: space.lg },
  badge: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    backgroundColor: colors.pink,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: space.md,
  },
  badgeHash: {
    fontFamily: fonts.black,
    color: colors.darkpurple,
    fontSize: 14,
    marginTop: 10,
  },
  badgeNumber: {
    fontFamily: fonts.black,
    color: colors.yellow,
    fontSize: 32,
    lineHeight: 32,
  },
  headerText: { flex: 1, gap: 4 },
  date: {
    fontFamily: fonts.bold,
    color: colors.yellow,
    fontSize: 18,
    letterSpacing: 0.8,
  },
  season: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 11,
    letterSpacing: 1,
  },

  facts: { gap: space.md },
  fact: { flexDirection: "row", alignItems: "baseline", gap: space.md },
  factLabel: {
    width: 70,
    textAlign: "right",
    fontFamily: fonts.bold,
    color: colors.white60,
    fontSize: 12,
    letterSpacing: 1,
  },
  factValue: { flex: 1 },
  player: { fontFamily: fonts.bold, color: colors.yellow, fontSize: 22 },
  teams: { fontFamily: fonts.bold, color: colors.white, fontSize: 22 },
  teamName: { color: colors.pink },
  types: { fontFamily: fonts.bold, color: colors.white, fontSize: 16 },

  courtWrap: { alignItems: "center", paddingVertical: space.sm },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  actionButtons: { flexDirection: "row", gap: space.sm },
  action: {
    backgroundColor: colors.yellow,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  pressed: { opacity: 0.75 },
  actionText: {
    fontFamily: fonts.black,
    color: colors.darkpurple,
    fontSize: 12,
  },

  nav: { flexDirection: "row", gap: space.sm },
  navArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.yellow,
    backgroundColor: colors.darkpurple,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrowDisabled: { opacity: 0.4 },
  navArrowPressed: { backgroundColor: colors.darkpurpleLighter },
});
