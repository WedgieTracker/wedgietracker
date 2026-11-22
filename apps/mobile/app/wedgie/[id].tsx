import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { WIDE_MIN, useSideInsets, useWide } from "@/lib/wide";
import { CourtPositionDiagram } from "@/components/CourtPositionDiagram";
import { Glass } from "@/components/Glass";
import { GradientFill } from "@/components/Gradient";
import { GameTimeline } from "@/components/GameTimeline";
import { ErrorState, Loading } from "@/components/States";
import { WedgiePlayer, pickVideoForApp } from "@/components/WedgiePlayer";
import { WedgieVideoTabs } from "@/components/WedgieVideoTabs";
import { api, type RouterOutputs } from "@/lib/api";
import { openExternal } from "@/lib/links";
import { track } from "@/lib/observability";
import { useShotScroll } from "@/lib/screenshot";
import { GemTag } from "@/components/GemTag";
import { Matchup } from "@/components/Matchup";
import { StickySplit } from "@/components/StickySplit";
import { SupportFooter } from "@/components/SupportFooter";
import { isGem, nightDate } from "@/lib/dates";
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
  // Two columns only when the page itself is wide (full screen on an opened
  // Duo). A sheet opened while folded stays narrow after unfolding, so this
  // goes by the page's own width rather than the screen's.
  const { wide: wideScreen } = useWide();
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const wide = pageWidth === null ? wideScreen : pageWidth >= WIDE_MIN;
  const onPageLayout = (e: LayoutChangeEvent) =>
    setPageWidth(e.nativeEvent.layout.width);
  const sides = useSideInsets();
  const insets = useSafeAreaInsets();
  const [shoutoutNote, setShoutoutNote] = useState(false);
  // Dev builds only: lets the screenshot driver scroll the sheet.
  const sheetRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useShotScroll(sheetRef);
  // Drives the pinned video column on a wide screen.
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );
  const [active, setActive] = useState<ActiveVideo | null>(() =>
    pickVideoForApp(wedgie.videoUrl),
  );

  // The sheet is sized to its content, so on a shorter screen the court is the
  // piece that gives way - everything above it carries information the court
  // only illustrates.
  const courtWidth = wideScreen
    ? 150
    : height >= 820
      ? 130
      : height >= 720
        ? 112
        : 92;
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

  const player = (
    <>
      {wedgie.videoUrl ? (
        <WedgieVideoTabs
          videoUrl={wedgie.videoUrl}
          activeVideo={active}
          onChange={setActive}
        />
      ) : null}

      <WedgiePlayer videoUrl={wedgie.videoUrl} active={active} />
    </>
  );
  const media = (
    <>
      <View style={styles.topBar}>
        <GlassNav
          size={38}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
        />
        <GlassClose size={38} onPress={onClose} />
      </View>

      {player}
    </>
  );
  const court = (
    <View style={styles.courtWrap}>
      <CourtPositionDiagram
        position={wedgie.position}
        width={courtWidth}
        dotSize={Math.max(9, Math.round(courtWidth * 0.09))}
      />
    </View>
  );
  // Number badge beside the date and season, as the info panel has it.
  const headerRow = (
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
        {isGem(wedgie.wedgieDate) ? (
          // GEMS have no real date.
          <View style={styles.gemRow}>
            <GemTag />
            <Text style={styles.date} allowFontScaling={false}>
              Not part of a season
            </Text>
          </View>
        ) : (
          <Text style={styles.date} allowFontScaling={false}>
            {nightDate(wedgie.wedgieDate)}
          </Text>
        )}
        {wedgie.seasonName && wedgie.seasonName !== "GEMS" ? (
          <Text style={styles.season} allowFontScaling={false}>
            {wedgie.seasonName} SEASON
          </Text>
        ) : null}
      </View>
    </View>
  );
  const basicFacts = (
    <>
      <Fact label="Player">
        <Text style={styles.player}>{wedgie.playerName}</Text>
      </Fact>
      <Fact label="Teams">
        <Text style={styles.teams}>
          <Matchup wedgie={wedgie} teamStyle={styles.teamName} />
        </Text>
      </Fact>
      {wedgie.types.length > 0 ? (
        <Fact label="Type">
          <Text style={styles.types}>
            {wedgie.types.map((t) => t.name).join(", ")}
          </Text>
        </Fact>
      ) : null}
    </>
  );
  const details = (
    <View style={styles.body}>
      {wide ? null : headerRow}

      <View style={styles.facts}>
        {wide ? null : basicFacts}
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
                  onPress={() => void openExternal(shoutoutProfileUrl(handle))}
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
                if (tweet) void openExternal(tweetUrl("NoDunksInc", tweet.id));
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

      {/* On a wide screen the court sits under the video instead. */}
      {wide ? null : court}
    </View>
  );

  if (wide) {
    // Full screen on a wide screen (the opened Duo). The close button and the
    // arrows stand in the empty gutter on the left, as a rail mirroring the
    // tab bar on the right. The left half holds a small court above the video,
    // centred in the screen and pinned while the details scroll on the right.
    const top = insets.top + 8;
    const gutter = sides.left + 16;
    return (
      <View style={[styles.sheet, styles.flex]}>
        <Animated.ScrollView
          style={styles.flex}
          onLayout={onPageLayout}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.wideContent,
            { paddingTop: top, paddingLeft: gutter, paddingRight: gutter },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <StickySplit
            scrollY={scrollY}
            inset={16}
            gap={36}
            left={
              <View style={[styles.wideMedia, { height: height - top - 32 }]}>
                <View style={styles.wideHeading}>
                  {headerRow}
                  <View style={styles.facts}>{basicFacts}</View>
                </View>
                <View style={styles.wideVideo}>
                  {player}
                  <View style={styles.wideCourt}>{court}</View>
                </View>
              </View>
            }
            right={
              <>
                {details}
                <SupportFooter />
              </>
            }
          />
        </Animated.ScrollView>
        {/* iOS-style controls in the empty bottom right of the modal. */}
        <View
          style={[
            styles.glassBar,
            { right: gutter, bottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <GlassNav
            size={48}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={onPrevious}
            onNext={onNext}
          />
          <GlassClose size={48} onPress={onClose} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={sheetRef}
      style={styles.sheet}
      onLayout={onPageLayout}
      // Clear of a side status bar column (the iPhone Duo's outer screen).
      contentContainerStyle={[
        styles.sheetContent,
        { paddingLeft: insets.left, paddingRight: insets.right },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {media}
      {details}
      <View style={styles.footer}>
        <SupportFooter />
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
          onPress={() => void openExternal("https://x.com/wedgietracker")}
        >
          @wedgietracker on X
        </Text>{" "}
        or{" "}
        <Text
          style={styles.noteLink}
          accessibilityRole="link"
          onPress={() =>
            void openExternal("https://bsky.app/profile/wedgietracker.com")
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
const PREVIOUS_PATH = "M15 19l-7-7 7-7";
const NEXT_PATH = "M9 5l7 7-7 7";

/** A round, translucent control in the style of iOS's own floating buttons. */
function GlassButton({
  size,
  label,
  enabled,
  onPress,
  path,
}: {
  size: number;
  label: string;
  enabled: boolean;
  onPress: () => void;
  path: string;
}) {
  return (
    <Pressable
      onPress={enabled ? onPress : undefined}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={4}
      style={({ pressed }) => [
        { width: size, height: size },
        styles.glassButton,
        pressed && enabled && styles.glassPressed,
        !enabled && styles.navButtonDisabled,
      ]}
    >
      <Svg
        width={Math.round(size * 0.42)}
        height={Math.round(size * 0.42)}
        viewBox="0 0 24 24"
        fill="none"
      >
        <Path
          d={path}
          stroke={colors.white}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

/** Newer and older, in one glass capsule, as iOS groups paired controls. */
function GlassNav({
  size,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: {
  size: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <Glass style={[styles.glassPill, { height: size, borderRadius: size / 2 }]}>
      <GlassButton
        size={size}
        label="Newer wedgie"
        enabled={hasPrevious}
        onPress={onPrevious}
        path={PREVIOUS_PATH}
      />
      <View style={[styles.glassDivider, { height: size / 2 }]} />
      <GlassButton
        size={size}
        label="Older wedgie"
        enabled={hasNext}
        onPress={onNext}
        path={NEXT_PATH}
      />
    </Glass>
  );
}

function GlassClose({ size, onPress }: { size: number; onPress: () => void }) {
  return (
    <Glass
      style={[
        styles.glassCircle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <GlassButton
        size={size}
        label="Close"
        enabled
        onPress={onPress}
        path="M7 7L17 17M17 7L7 17"
      />
    </Glass>
  );
}

const styles = StyleSheet.create({
  gemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  footer: { paddingHorizontal: space.lg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: space.sm,
  },
  // Everything under the full-bleed video keeps the page gutter.
  body: { padding: space.lg, gap: space.md },
  wideContent: { flexGrow: 1, paddingBottom: 32 },
  flex: { flex: 1 },
  // Heading, video and court as one group with even gaps, centred in the
  // screen's height rather than spread to its edges.
  wideMedia: { justifyContent: "center", gap: 32 },
  wideHeading: { gap: space.md },
  wideCourt: { alignItems: "center" },
  wideVideo: { width: "100%", gap: 32 },
  glassBar: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  glassPill: { flexDirection: "row", alignItems: "center", overflow: "hidden" },
  glassCircle: { overflow: "hidden" },
  glassButton: { alignItems: "center", justifyContent: "center" },
  glassPressed: { backgroundColor: "rgba(255, 255, 255, 0.16)" },
  glassDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  padded: { flex: 1, padding: space.lg, backgroundColor: colors.night },

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
  player: { fontFamily: fonts.bold, color: colors.cream, fontSize: 22 },
  teams: { fontFamily: fonts.bold, color: colors.white, fontSize: 22 },
  teamName: { color: colors.violet },
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
  shoutoutTextPressed: { color: colors.night },
  // The facts' label column plus the gap between label and value.
  valueColumn: { paddingLeft: LABEL_WIDTH + space.md, gap: space.md },
  noDunks: { alignSelf: "flex-start" },
  noDunksLogo: { width: 32, height: 32, borderRadius: 6 },

  // Bottom left under the details, as the web panel pins it.
  courtWrap: { alignItems: "flex-start", paddingTop: space.sm },

  // Only the chevron dims: the container keeps its shape at either end of the
  // list, so the control never looks half-missing.
  navButtonDisabled: { opacity: 0.28 },
});
