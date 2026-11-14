import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { COURT_PATHS, COURT_VIEWBOX } from "@/components/CourtPositionDiagram";
import { GradientFill, Grain } from "@/components/Gradient";
import { HiddenHeading, PageHeading } from "@/components/PageHeading";
import { PaceGauge } from "@/components/PaceGauge";
import { ErrorState } from "@/components/States";
import { StickerButton } from "@/components/StickerButton";
import { StickySplit } from "@/components/StickySplit";
import { TopSafeArea } from "@/components/TopSafeArea";
import { TypingStats } from "@/components/TypingStats";
import { WaveCounterPanel } from "@/components/WaveCounterPanel";
import { api, type RouterOutputs } from "@/lib/api";
import { useTabBarClearance } from "@/lib/layout";
import { useShotScroll } from "@/lib/screenshot";
import { badgeTextShadow, colors, fonts } from "@/lib/theme";
import { useWide } from "@/lib/wide";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";

type NerdStats = RouterOutputs["wedgie"]["getNerdStats"];
type NerdExtras = RouterOutputs["wedgie"]["getNerdExtras"];

const PINK = "#F25CB5";
const VIEW_W = 1023.9248;
const VIEW_H = 751.14307;

const nickname = (code: string) =>
  TEAMS.find((t) => t.code === code)?.nickname ?? code;
const nf = (n: number) => n.toLocaleString("en-US");
const niceDate = (iso: string) =>
  iso
    ? new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

/**
 * Port of apps/web/src/components/stats-for-nerds/StatsForNerds.tsx, laid out
 * for a phone: the season card with its split-flap board, the pace gauge,
 * games since the last wedgie with the leaders, all time with the court
 * heatmap, records, shot types, quarters and career leaders. On a wide
 * screen the season card sits on the left and the rest on the right, as on
 * the desktop site.
 *
 * The all-time extras come from a newer procedure; until a server has it,
 * those sections are left out rather than shown broken.
 */
export default function StatsScreen() {
  const nerd = api.wedgie.getNerdStats.useQuery();
  const extras = api.wedgie.getNerdExtras.useQuery(undefined, { retry: 1 });
  const tabBar = useTabBarClearance();
  const shotRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useShotScroll(shotRef);
  const { wide } = useWide();
  // Drives the pinned season card on a wide screen.
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );
  const router = useRouter();

  const season = (
    <SeasonCard stats={nerd.data ?? null} flapHeight={wide ? 18 : 22} />
  );
  const rest = nerd.data ? (
    <NerdColumn
      stats={nerd.data}
      extras={extras.data ?? null}
      extrasPending={extras.isPending}
      onPace={() => router.push("/pace")}
      onStandings={() => router.push("/standings")}
      onSeasons={() => router.push("/seasons?from=Stats")}
    />
  ) : (
    <ColumnSkeleton />
  );

  return (
    <TopSafeArea style={styles.safe}>
      <Animated.ScrollView
        ref={shotRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: tabBar }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={nerd.isRefetching}
            onRefresh={() => {
              void nerd.refetch();
              void extras.refetch();
            }}
            tintColor={colors.cream}
          />
        }
      >
        <PageHeading title="Stats for nerds" />

        {nerd.error ? (
          <View style={styles.error}>
            <ErrorState onRetry={() => void nerd.refetch()} />
          </View>
        ) : wide ? (
          <View style={styles.splitWrap}>
            <StickySplit
              scrollY={scrollY}
              left={season}
              right={rest}
              inset={16}
              gap={16}
            />
          </View>
        ) : (
          <View style={styles.column}>
            {season}
            {rest}
          </View>
        )}

        <Text style={styles.disclaimer} allowFontScaling={false}>
          WedgieTracker is an independent fan project, not affiliated with or
          endorsed by the NBA or its teams.
        </Text>
      </Animated.ScrollView>
    </TopSafeArea>
  );
}

/**
 * "In the 2026/27 season", the wave counter and the split-flap board. With
 * no stats yet it keeps its shape, empty.
 */
function SeasonCard({
  stats,
  flapHeight,
}: {
  stats: NerdStats | null;
  flapHeight: number;
}) {
  return (
    <View>
      <View style={styles.seasonHeader}>
        <Text style={styles.seasonHeaderText} allowFontScaling={false}>
          In the{" "}
        </Text>
        <View style={styles.seasonChip}>
          <Text style={styles.seasonHeaderText} allowFontScaling={false}>
            {stats?.currentSeason ?? "0000/00"}
          </Text>
        </View>
        <Text style={styles.seasonHeaderText} allowFontScaling={false}>
          {" "}
          season
        </Text>
      </View>
      <View style={styles.counterGroup}>
        <WaveCounterPanel
          value={stats?.wedgiesThisSeason ?? null}
          previousRecord={stats?.previousRecord ?? Number.POSITIVE_INFINITY}
          minHeight={300}
        />
        <View style={styles.board}>
          {stats ? (
            <TypingStats stats={stats.statsPerWedgie} flapHeight={flapHeight} />
          ) : (
            <View style={{ height: flapHeight + 16 + 33 }} />
          )}
        </View>
      </View>
    </View>
  );
}

function NerdColumn({
  stats,
  extras,
  extrasPending,
  onPace,
  onStandings,
  onSeasons,
}: {
  stats: NerdStats;
  extras: NerdExtras | null;
  extrasPending: boolean;
  onPace: () => void;
  onStandings: () => void;
  onSeasons: () => void;
}) {
  const topTeamCount = stats.leaders.teams[0]?.wedgies ?? 0;
  const teamLeaders = stats.leaders.teams
    .filter((t) => t.wedgies === topTeamCount && topTeamCount > 0)
    .map((t) => nickname(t.name));
  const playerLeaders = stats.leaders.players.map((p) => p.name);
  const playerTop = stats.leaders.players[0]?.count ?? 0;
  const perGames = Math.round(
    stats.totalGamesOverall / Math.max(1, stats.totalWedgiesOverall),
  );
  const diff = stats.pace - stats.averageLastTenSeasons;

  return (
    <View style={styles.column}>
      <HiddenHeading>Pace</HiddenHeading>
      <Card style={styles.centred}>
        <View style={styles.gauge}>
          <PaceGauge
            pace={stats.pace}
            record={stats.previousRecord}
            recordSeason={null}
            bare
            onExplain={onPace}
          />
        </View>
        <Line centred>
          <B>
            {Math.abs(diff)} {diff >= 0 ? "more" : "fewer"}
          </B>{" "}
          than the average of {stats.averageLastTenSeasons} over the past{" "}
          {stats.averageSeasonsCount} seasons.
        </Line>
        <More label="How the pace works" onPress={onPace} />
      </Card>

      <HiddenHeading>{`${stats.currentSeason} so far`}</HiddenHeading>
      <Card>
        <View style={styles.since}>
          <View style={styles.tile}>
            <GradientFill name="badge" radius={16} />
            <Grain radius={16} />
            <Text
              style={[styles.tileNumber, badgeTextShadow(44)]}
              allowFontScaling={false}
            >
              {stats.gamesSinceLastWedgie ?? 0}
            </Text>
          </View>
          <View style={styles.flex}>
            <Kicker>
              {stats.gamesSinceLastWedgie === 1 ? "Game" : "Games"} since the
              last wedgie
            </Kicker>
            {stats.lastWedgiePlayer ? (
              <Text style={styles.lastPlayer} allowFontScaling={false}>
                {stats.lastWedgiePlayer}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.leaders}>
          <Leaders
            label="Leading teams"
            names={teamLeaders}
            count={topTeamCount}
            plural="teams"
          />
          <Leaders
            label="Leading players"
            names={playerLeaders}
            count={playerTop}
            plural="players"
          />
        </View>
        <More label="Leaderboard" onPress={onStandings} />
      </Card>

      <HiddenHeading>All time</HiddenHeading>
      <View style={styles.allTime}>
        <Card>
          <Kicker>All time</Kicker>
          <Text style={styles.big} allowFontScaling={false}>
            {nf(stats.totalWedgiesOverall)}
          </Text>
          <Text
            style={[styles.kicker, styles.bigLabel]}
            allowFontScaling={false}
          >
            WEDGIES
          </Text>
          <View style={styles.list}>
            {(
              [
                [String(stats.totalSeasonsOverall), "seasons"],
                [nf(stats.totalGamesOverall), "games"],
                [String(perGames), "games per wedgie"],
              ] as const
            ).map(([n, label]) => (
              <View key={label} style={styles.listRow}>
                <Text style={styles.listLabel} allowFontScaling={false}>
                  {label.toUpperCase()}
                </Text>
                <Text style={styles.listValue} allowFontScaling={false}>
                  {n}
                </Text>
              </View>
            ))}
          </View>
          <More label="Seasons history" onPress={onSeasons} />
        </Card>
        {extras ? (
          <Card style={styles.heatCard}>
            <CourtHeat points={extras.positions} />
          </Card>
        ) : extrasPending ? (
          <View style={[styles.placeholder, styles.heatPlaceholder]} />
        ) : null}
      </View>

      {extras ? (
        <>
          <HiddenHeading>Records</HiddenHeading>
          <Card>
            <Records records={extras.records} />
          </Card>

          <SectionTitle>Shot types</SectionTitle>
          <Card>
            <Bars
              rows={extras.types
                .slice(0, 8)
                .map((t) => ({ label: t.name, count: t.count }))}
            />
          </Card>

          <SectionTitle>When in the game</SectionTitle>
          <Card>
            <Columns rows={extras.quarters} />
          </Card>

          <SectionTitle>Career leaders</SectionTitle>
          <Card>
            <Bars
              rows={extras.career.map((p) => ({
                label: p.name,
                count: p.count,
              }))}
            />
          </Card>
        </>
      ) : extrasPending ? (
        <View style={[styles.placeholder, { height: 220 }]} />
      ) : null}
    </View>
  );
}

/** The column's shape while the stats load, so nothing jumps when they land. */
function ColumnSkeleton() {
  return (
    <View style={styles.column}>
      {[260, 240, 300].map((height, i) => (
        <View key={i} style={[styles.placeholder, { height }]} />
      ))}
    </View>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | false | undefined)[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.kicker} allowFontScaling={false}>
      {typeof children === "string" ? children.toUpperCase() : children}
    </Text>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={styles.sectionTitle}
      accessibilityRole="header"
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
}

function Line({
  children,
  centred = false,
}: {
  children: React.ReactNode;
  centred?: boolean;
}) {
  return (
    <Text
      style={[styles.line, centred && styles.lineCentred]}
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <Text style={styles.strong}>{children}</Text>;
}

function More({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.more}>
      <StickerButton label={label} small onPress={onPress} />
    </View>
  );
}

/** Tied leaders: how many, then every name. */
function Leaders({
  label,
  names,
  count,
  plural,
}: {
  label: string;
  names: string[];
  count: number;
  plural: string;
}) {
  if (!names.length) return null;
  return (
    <View>
      <Kicker>{label}</Kicker>
      <Line>
        {names.length === 1 ? (
          <>
            <B>{names[0]}</B> leads with {count}
          </>
        ) : (
          <>
            <B>
              {names.length} {plural}
            </B>{" "}
            tied on {count}
          </>
        )}
      </Line>
      {names.length > 1 ? (
        <View style={styles.names}>
          {names.map((n) => (
            <View key={n} style={styles.name}>
              <Text style={styles.nameText} allowFontScaling={false}>
                {n}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Records({ records }: { records: NerdExtras["records"] }) {
  const gameDate = (name: string) => /\d{4}-\d{2}-\d{2}/.exec(name)?.[0] ?? "";
  const rows = [
    records.drought.games > 0 && [
      nf(records.drought.games),
      `games without a wedgie, from ${records.drought.fromPlayer} on ${niceDate(records.drought.fromDate)} to ${records.drought.toPlayer} on ${niceDate(records.drought.toDate)}`,
    ],
    records.mostInGame && [
      String(records.mostInGame.count),
      `in one game: ${records.mostInGame.game.replace(/ - .*/, "").replace(" @ ", " vs ")}, ${niceDate(gameDate(records.mostInGame.game))}`,
    ],
    [
      String(records.mostInNight.count),
      `in one night: ${records.mostInNight.dates.map(niceDate).join(" and ")}`,
    ],
    [String(records.multiGames), "games with more than one wedgie"],
  ].filter((r): r is [string, string] => !!r);

  return (
    <View style={styles.records}>
      {rows.map(([n, text]) => (
        <View key={text} style={styles.record}>
          <Text
            style={styles.recordNumber}
            adjustsFontSizeToFit
            numberOfLines={1}
            allowFontScaling={false}
          >
            {n}
          </Text>
          <Text style={styles.recordText} allowFontScaling={false}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <View style={styles.bars}>
      {rows.map((r, i) => (
        <View key={r.label} style={styles.barRow}>
          <Text
            style={styles.barLabel}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {r.label}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                i === 0 && styles.barTop,
                { width: `${(r.count / max) * 100}%` },
              ]}
            >
              {i === 0 ? null : <GradientFill name="button" radius={4} />}
            </View>
          </View>
          <Text style={styles.barCount} allowFontScaling={false}>
            {r.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Columns({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <View style={styles.columns}>
      {rows.map((r) => (
        <View
          key={r.label}
          style={styles.columnItem}
          accessible
          accessibilityLabel={`${r.label}: ${r.count}`}
        >
          <Text style={styles.columnText} allowFontScaling={false}>
            {r.count}
          </Text>
          <View style={styles.columnTrack}>
            <View
              style={[
                styles.columnBar,
                r.count === max ? styles.barTop : styles.columnIdle,
                { height: `${(r.count / max) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.columnText} allowFontScaling={false}>
            {r.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CourtHeat({ points }: { points: { x: number; y: number }[] }) {
  return (
    <View
      style={styles.heat}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Where ${points.length} wedgies happened on the court`}
    >
      <Svg width="100%" height="100%" viewBox={COURT_VIEWBOX}>
        {COURT_PATHS.map((d) => (
          <Path key={d.slice(0, 12)} d={d} fill="rgba(240, 225, 182, 0.55)" />
        ))}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={(p.x / 100) * VIEW_W}
            cy={(p.y / 100) * VIEW_H}
            r={9}
            fill={PINK}
            fillOpacity={0.38}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.night },
  content: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  error: { paddingTop: 24 },
  splitWrap: { marginTop: 8 },
  column: { gap: 14, marginTop: 8 },
  flex: { flex: 1 },
  centred: { alignItems: "center" },
  disclaimer: {
    fontFamily: fonts.bold,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  seasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 14,
  },
  seasonHeaderText: {
    fontFamily: fonts.extraBold,
    color: colors.cream,
    fontSize: 20,
  },
  // `bg-violet rounded-md px-2 py-0.5`
  seasonChip: {
    backgroundColor: colors.violet,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  // The counter and the board read as one card, clipped together.
  counterGroup: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.violet20,
  },
  board: {
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    paddingVertical: 20,
  },

  // `bg-panel border-violet/20 rounded-[22px] border p-[18px]`
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.violet20,
    backgroundColor: colors.panel,
    overflow: "hidden",
  },
  placeholder: { borderRadius: 22, backgroundColor: "rgba(29, 18, 66, 0.6)" },
  gauge: { width: "100%", maxWidth: 245 },
  kicker: {
    fontFamily: fonts.black,
    fontSize: 11.5,
    letterSpacing: 1.4,
    color: "rgba(240, 225, 182, 0.6)",
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: -4,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.2,
    color: colors.cream,
  },
  line: {
    marginTop: 8,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    lineHeight: 19,
    color: "rgba(240, 225, 182, 0.75)",
  },
  lineCentred: { textAlign: "center" },
  strong: { color: colors.cream },
  more: { marginTop: 16, alignSelf: "flex-start" },

  since: { flexDirection: "row", alignItems: "center", gap: 16 },
  // `size-20 rounded-2xl pr-[0.12em] text-[44px] italic`: no negative
  // tracking and a little right padding, so the slanted figure looks centred.
  tile: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 44 * 0.12,
  },
  tileNumber: {
    fontFamily: fonts.blackItalic,
    fontSize: 44,
    lineHeight: 48,
    color: colors.cream,
  },
  lastPlayer: {
    marginTop: 4,
    fontFamily: fonts.black,
    fontSize: 22,
    lineHeight: 26,
    color: colors.cream,
  },
  leaders: {
    marginTop: 16,
    paddingTop: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.violet20,
  },
  names: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  name: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.violet20,
  },
  nameText: {
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    color: colors.cream,
  },

  // The list, then the court: the site only sets them side by side from
  // 640px, wider than a phone or the Duo's half column.
  allTime: { gap: 14 },
  heatCard: { paddingVertical: 24 },
  heatPlaceholder: { height: 240 },
  big: {
    marginTop: 8,
    fontFamily: fonts.blackItalic,
    fontSize: 64,
    lineHeight: 62,
    paddingRight: 6,
    color: colors.cream,
  },
  bigLabel: { marginTop: 6, letterSpacing: 1.6 },
  list: { marginTop: 16, gap: 10 },
  listRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.violet20,
  },
  listLabel: {
    flexShrink: 1,
    fontFamily: fonts.black,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: "rgba(240, 225, 182, 0.6)",
  },
  listValue: {
    fontFamily: fonts.blackItalic,
    fontSize: 26,
    lineHeight: 28,
    paddingRight: 2.6,
    color: colors.cream,
  },
  heat: { width: "100%", aspectRatio: VIEW_W / VIEW_H },

  records: { gap: 12 },
  record: { flexDirection: "row", alignItems: "center", gap: 10 },
  // Centred in a 60pt column: no negative tracking, a little right padding.
  recordNumber: {
    width: 60,
    textAlign: "center",
    paddingRight: 3,
    fontFamily: fonts.blackItalic,
    fontSize: 30,
    lineHeight: 34,
    color: colors.cream,
  },
  recordText: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: "rgba(240, 225, 182, 0.75)",
  },

  bars: { gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: {
    width: 128,
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    color: colors.cream,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.violet20,
  },
  barFill: { height: "100%", borderRadius: 4, overflow: "hidden" },
  barTop: {
    backgroundColor: PINK,
    shadowColor: PINK,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  barCount: {
    width: 28,
    textAlign: "right",
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    fontVariant: ["tabular-nums"],
    color: "rgba(240, 225, 182, 0.65)",
  },

  columns: { flexDirection: "row", gap: 6, height: 128, marginTop: 4 },
  columnItem: { flex: 1, alignItems: "center", gap: 6 },
  columnTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  columnBar: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  columnIdle: { backgroundColor: "rgba(154, 92, 245, 0.4)" },
  columnText: {
    fontFamily: fonts.black,
    fontSize: 10.5,
    fontVariant: ["tabular-nums"],
    color: "rgba(240, 225, 182, 0.6)",
  },
});
