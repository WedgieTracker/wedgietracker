import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { CourtPositionDiagram } from "@/components/CourtPositionDiagram";
import { GradientFill } from "@/components/Gradient";
import { GameTimeline } from "@/components/GameTimeline";
import { ErrorState, Loading } from "@/components/States";
import { WedgiePlayer, pickVideoForApp } from "@/components/WedgiePlayer";
import { WedgieVideoTabs } from "@/components/WedgieVideoTabs";
import { api, type RouterOutputs } from "@/lib/api";
import { track } from "@/lib/observability";
import { nightDate } from "@/lib/dates";
import { badgeTextShadow, colors, fonts, radius, space } from "@/lib/theme";
import { gameTimeline } from "@wedgietracker/core/utils/gameMoment";
import {
  shoutoutNetwork,
  shoutoutProfileUrl,
} from "@wedgietracker/core/utils/shoutout";
import { tweetUrl } from "@wedgietracker/core/utils/twitterHandle";
import type { ActiveVideo } from "@wedgietracker/core/utils/wedgieVideo";

type Wedgie = RouterOutputs["wedgie"]["getAll"][number];

/** Matches `sheetCornerRadius` in the route's options. */
const SHEET_RADIUS = 24;

/** The web badge is `text-[1.6em]` with a `text-[.45em]` hash. */
const BADGE_NUMBER = 32;
const BADGE_HASH = BADGE_NUMBER * 0.45;

/** Wide enough for the longest label, SHOUTOUT with its ⓘ, on one line. */
const LABEL_WIDTH = 106;

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
        <ErrorState onRetry={() => void all.refetch()} />
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
      onClose={() => router.back()}
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
  onClose,
}: {
  wedgie: Wedgie;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const [shoutoutNote, setShoutoutNote] = useState(false);
  const [active, setActive] = useState<ActiveVideo | null>(() =>
    pickVideoForApp(wedgie.videoUrl),
  );

  // The sheet is sized to its content, so on a shorter screen the court is the
  // piece that gives way - everything above it carries information the court
  // only illustrates.
  const courtWidth = height >= 820 ? 130 : height >= 720 ? 112 : 92;
  const timeline = gameTimeline(wedgie);

  // Reset the chosen source when stepping to another wedgie.
  useEffect(() => {
    setActive(pickVideoForApp(wedgie.videoUrl));
  }, [wedgie.id, wedgie.videoUrl]);

  // Which wedgies get watched, and which source served them. The source is the
  // useful half: it shows which publisher's embed the app ended up using.
  useEffect(() => {
    track("wt_wedgie_opened", {
      number: wedgie.number,
      season: wedgie.seasonName,
      source: pickVideoForApp(wedgie.videoUrl),
    });
  }, [wedgie.id, wedgie.number, wedgie.seasonName, wedgie.videoUrl]);

  return (
    <ScrollView
      style={styles.sheet}
      contentContainerStyle={styles.sheetContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View style={styles.navGroup}>
          <NavButton
            direction="previous"
            enabled={hasPrevious}
            onPress={onPrevious}
          />
          <View style={styles.navDivider} />
          <NavButton direction="next" enabled={hasNext} onPress={onNext} />
        </View>
        <CloseButton onPress={onClose} />
      </View>

      {wedgie.videoUrl ? (
        <WedgieVideoTabs
          videoUrl={wedgie.videoUrl}
          activeVideo={active}
          onChange={setActive}
        />
      ) : null}

      <WedgiePlayer videoUrl={wedgie.videoUrl} active={active} />

      <View style={styles.body}>
        {/* Number badge beside the date and season, as the info panel has it. */}
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <GradientFill name="button" radius={radius.md} />
            <Text
              style={[
                styles.badgeHash,
                {
                  fontSize: BADGE_HASH,
                  lineHeight: BADGE_HASH,
                  // `mt-[.75em]` on the web, dropping the hash to the numeral's foot
                  marginTop: BADGE_HASH * 0.75,
                },
              ]}
              allowFontScaling={false}
            >
              #
            </Text>
            <Text
              style={[
                styles.badgeNumber,
                { fontSize: BADGE_NUMBER, lineHeight: BADGE_NUMBER + 4 },
                badgeTextShadow(BADGE_NUMBER),
              ]}
              allowFontScaling={false}
            >
              {wedgie.number ?? 1}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.date} allowFontScaling={false}>
              {nightDate(wedgie.wedgieDate)}
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
          {wedgie.shoutouts.length > 0 ? (
            <Fact
              label="Shoutout"
              info={{
                open: shoutoutNote,
                onToggle: () => setShoutoutNote((o) => !o),
              }}
            >
              {/* The X and Bluesky accounts that tagged the wedgie, as pills like the site's. */}
              <View style={styles.shoutouts}>
                {wedgie.shoutouts.map((handle) => (
                  <Pressable
                    key={handle}
                    accessibilityRole="link"
                    accessibilityLabel={
                      shoutoutNetwork(handle) === "bluesky"
                        ? `${handle} on Bluesky`
                        : `@${handle} on X`
                    }
                    hitSlop={4}
                    style={({ pressed }) => [
                      styles.shoutout,
                      pressed && styles.shoutoutPressed,
                    ]}
                    onPress={() =>
                      void Linking.openURL(shoutoutProfileUrl(handle))
                    }
                  >
                    {({ pressed }) => (
                      <Text
                        style={[
                          styles.shoutoutText,
                          pressed && styles.shoutoutTextPressed,
                        ]}
                      >
                        @{handle}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </Fact>
          ) : null}
        </View>

        {shoutoutNote ? (
          <ShoutoutNote onClose={() => setShoutoutNote(false)} />
        ) : null}

        {/* Lined up with the values above (Player, Teams...), not the labels. */}
        {timeline || wedgie.noDunksTweet ? (
          <View style={styles.valueColumn}>
            {timeline ? <GameTimeline timeline={timeline} /> : null}

            {wedgie.noDunksTweet ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="No Dunks tweet"
                hitSlop={8}
                style={styles.noDunks}
                onPress={() => {
                  const tweet = wedgie.noDunksTweet;
                  if (tweet)
                    void Linking.openURL(tweetUrl("NoDunksInc", tweet.id));
                }}
              >
                <Image
                  source={require("../../assets/images/nodunks-logo.png")}
                  style={styles.noDunksLogo}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.courtWrap}>
          <CourtPositionDiagram
            position={wedgie.position}
            width={courtWidth}
            dotSize={Math.max(9, Math.round(courtWidth * 0.09))}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function Fact({
  label,
  info,
  children,
}: {
  label: string;
  /** An ⓘ before the label that opens a note under the facts. */
  info?: { open: boolean; onToggle: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fact}>
      <View style={styles.factLabelBox}>
        {info ? (
          <Pressable
            onPress={info.onToggle}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="How do shoutouts work?"
            accessibilityState={{ expanded: info.open }}
            style={[styles.info, info.open && styles.infoOpen]}
          >
            <Text style={styles.infoText} allowFontScaling={false}>
              i
            </Text>
          </Pressable>
        ) : null}
        <Text
          style={styles.factLabel}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {label.toUpperCase()}
        </Text>
      </View>
      <View style={styles.factValue}>{children}</View>
    </View>
  );
}

/** How a name gets onto a wedgie, opened from the ⓘ by Shoutout. */
function ShoutoutNote({ onClose }: { onClose: () => void }) {
  return (
    <Pressable onPress={onClose} style={styles.note} accessibilityRole="text">
      <Text style={styles.noteText}>
        Shoutouts go to whoever tags the wedgie first. Spot one in a game? Tag{" "}
        <Text
          style={styles.noteLink}
          accessibilityRole="link"
          onPress={() => void Linking.openURL("https://x.com/wedgietracker")}
        >
          @wedgietracker on X
        </Text>{" "}
        or{" "}
        <Text
          style={styles.noteLink}
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL("https://bsky.app/profile/wedgietracker.com")
          }
        >
          wedgietracker.com on Bluesky
        </Text>{" "}
        and your name goes here.
      </Text>
    </Pressable>
  );
}

/**
 * A labelled step control rather than a bare chevron: it names the wedgie you
 * are moving to, so you know whether it is worth the tap.
 */
/**
 * Half of a joined two-part control, the way Safari draws back and forward.
 *
 * It carried "NEWER"/"OLDER" over a "#31" before, which meant two lines of
 * 8pt type inside a small pill, twice, beside the plain yellow close circle.
 * The number was already the largest thing on the screen in the pink badge,
 * and a pair of chevrons does not need the words spelling out, so both went.
 */
function NavButton({
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
      accessibilityRole="button"
      accessibilityLabel={
        direction === "previous" ? "Newer wedgie" : "Older wedgie"
      }
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.navButton,
        !enabled && styles.navButtonDisabled,
        pressed && enabled && styles.navButtonPressed,
      ]}
    >
      <Chevron direction={direction} />
    </Pressable>
  );
}

const PREVIOUS_PATH = "M15 19l-7-7 7-7";
const NEXT_PATH = "M9 5l7 7-7 7";

function Chevron({ direction }: { direction: "previous" | "next" }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d={direction === "previous" ? PREVIOUS_PATH : NEXT_PATH}
        stroke={colors.yellow}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 6L18 18M18 6L6 18"
          stroke={colors.darkpurple}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    // No shadow here: on iOS a shadow on a view that also clips its children
    // casts each child's silhouette onto the content below it. Separation
    // comes from the dimmed backdrop (see the route's sheet options) and from
    // this being a shade darker than the pages it opens over.
    backgroundColor: colors.night,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
  },
  sheetContent: { paddingBottom: space.xl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: space.sm,
  },
  navGroup: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.darkpurpleLighter,
    overflow: "hidden",
  },
  navDivider: { width: 1, backgroundColor: colors.hairline },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  closePressed: { opacity: 0.7 },
  // Everything under the full-bleed video keeps the page gutter.
  body: { padding: space.lg, gap: space.md },
  padded: { flex: 1, padding: space.lg, backgroundColor: colors.darkpurple },

  headerRow: { flexDirection: "row", alignItems: "center", gap: space.lg },
  badge: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeHash: {
    fontFamily: fonts.blackItalic,
    color: "rgba(240, 225, 182, 0.6)",
  },
  badgeNumber: { fontFamily: fonts.blackItalic, color: colors.cream },
  headerText: { flex: 1, gap: 6 },
  date: { fontFamily: fonts.extraBold, color: colors.cream, fontSize: 18 },
  season: {
    fontFamily: fonts.bold,
    color: "rgba(240, 225, 182, 0.6)",
    fontSize: 10,
    letterSpacing: 1,
  },

  facts: { gap: space.md },
  fact: { flexDirection: "row", alignItems: "baseline", gap: space.md },
  factLabelBox: {
    width: LABEL_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  factLabel: {
    flexShrink: 1,
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
  // The site's pills: white/20 border on a white/5 fill, yellow when pressed.
  shoutouts: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  shoutout: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  shoutoutPressed: {
    backgroundColor: colors.cream,
    borderColor: colors.cream,
  },
  // The ⓘ: a ringed italic i, as on the web.
  info: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.cream50,
    alignItems: "center",
    justifyContent: "center",
  },
  infoOpen: { borderColor: colors.cream },
  infoText: {
    fontFamily: "Georgia-BoldItalic",
    fontSize: 10,
    lineHeight: 12,
    color: colors.cream70,
  },
  note: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.night,
  },
  noteLink: { textDecorationLine: "underline" },
  shoutoutText: { fontFamily: fonts.bold, color: colors.white, fontSize: 13 },
  shoutoutTextPressed: { color: colors.darkpurple },
  // The facts' label column plus the gap between label and value.
  valueColumn: { paddingLeft: LABEL_WIDTH + space.md, gap: space.md },
  noDunks: { alignSelf: "flex-start" },
  noDunksLogo: { width: 32, height: 32, borderRadius: 6 },

  // Bottom left under the details, as the web panel pins it.
  courtWrap: { alignItems: "flex-start", paddingTop: space.sm },

  navButton: {
    width: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  // Only the chevron dims: the container keeps its shape at either end of the
  // list, so the control never looks half-missing.
  navButtonDisabled: { opacity: 0.28 },
  navButtonPressed: { backgroundColor: colors.night },
});
