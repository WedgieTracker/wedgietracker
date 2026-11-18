import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CoffeeCup } from "@/components/CoffeeCup";
import { CoffeeScoreboard } from "@/components/CoffeeScoreboard";
import { FeaturedWedgie } from "@/components/FeaturedWedgie";
import { HeroStats } from "@/components/HeroStats";
import { Loader } from "@/components/Loader";
import { Logo } from "@/components/Logo";
import { HiddenHeading } from "@/components/PageHeading";
import { PlayersTeams } from "@/components/PlayersTeams";
import { ErrorState } from "@/components/States";
import { StickerButton } from "@/components/StickerButton";
import { StickySplit } from "@/components/StickySplit";
import { TopSafeArea } from "@/components/TopSafeArea";
import { WedgieRow } from "@/components/WedgieRow";
import { api } from "@/lib/api";
import { useWide } from "@/lib/wide";
import { useTabBarClearance } from "@/lib/layout";
import { colors, fonts, space } from "@/lib/theme";
import {
  heroForScreenshot,
  latestForScreenshot,
  useShotScroll,
} from "@/lib/screenshot";

/**
 * Mirrors apps/web/src/app/page.tsx: the badge hero, the latest wedgies, the
 * leaders, then the all-time total.
 *
 * The hero draws at once as a skeleton of itself and fills in when the stats
 * land. Everything below it waits for its three queries together and appears
 * in one go under the hero, so nothing already on screen moves.
 */
export default function HomeScreen() {
  const router = useRouter();
  const tabBar = useTabBarClearance();
  const shotRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useShotScroll(shotRef);
  // Drives the pinned left column on a wide screen.
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  const stats = api.wedgie.getStats.useQuery();
  const latest = api.wedgie.getLatestWedgies.useQuery();
  const standings = api.wedgie.getTopStandings.useQuery();
  const total = api.wedgie.getTotalWedgies.useQuery();
  const seasons = api.season.getAllWithStats.useQuery();
  // Not on every server yet, so a failure only hides the board.
  const coffees = api.donations.getSeasonCoffees.useQuery(undefined, {
    retry: 1,
  });
  const { wide } = useWide();

  // Which season set the record, for the gauge's note, worked out from the
  // seasons list where the stats do not carry it.
  const recordSeason = useMemo(() => {
    const record = stats.data?.previousRecord;
    if (!record || !seasons.data) return null;
    return seasons.data.find((s) => s.totalWedgies === record)?.name ?? null;
  }, [stats.data?.previousRecord, seasons.data]);

  const refreshing =
    stats.isRefetching ||
    latest.isRefetching ||
    standings.isRefetching ||
    total.isRefetching;

  const refetchAll = () => {
    void stats.refetch();
    void latest.refetch();
    void standings.refetch();
    void total.refetch();
    void coffees.refetch();
  };

  const loadError =
    stats.error ?? latest.error ?? standings.error ?? total.error;
  const columnReady = latest.data && standings.data && total.data !== undefined;

  const rows = latest.data ? latestForScreenshot(latest.data).slice(0, 3) : [];
  const [first, ...rest] = rows;

  const hero = (
    <HeroStats
      stats={stats.data ? heroForScreenshot(stats.data) : null}
      recordSeason={recordSeason}
      onMoreStats={() => router.push("/stats")}
      onExplainPace={() => router.push("/pace")}
    />
  );
  const column = columnReady ? (
    <View style={[styles.column, wide && styles.columnWide]}>
      {first ? (
        <View style={styles.section}>
          <HiddenHeading>Latest wedgies</HiddenHeading>
          <FeaturedWedgie
            wedgie={first}
            onPress={() => router.push(`/wedgie/${first.id}`)}
          />
          <View style={styles.rows}>
            {rest.map((wedgie) => (
              <WedgieRow
                key={wedgie.id}
                wedgie={wedgie}
                onPress={() => router.push(`/wedgie/${wedgie.id}`)}
              />
            ))}
          </View>
          <StickerButton
            label="See all wedgies"
            onPress={() => router.push("/all-wedgies")}
            style={styles.sectionButton}
          />
        </View>
      ) : null}

      {coffees.error ? null : (
        <CoffeeScoreboard
          data={coffees.data ?? null}
          onSupport={() => router.push("/support")}
        />
      )}

      {/* The web hides the leaders until the season has a wedgie. */}
      {standings.data?.hasWedgiesThisSeason ? (
        <View style={styles.section}>
          <HiddenHeading>Leaders</HiddenHeading>
          <PlayersTeams
            players={standings.data.players}
            teams={standings.data.teams}
            showCount={false}
            onPressItem={(name, kind) =>
              router.push({
                pathname: "/all-wedgies",
                params: kind === "teams" ? { wt: name } : { wp: name },
              })
            }
          />
          <StickerButton
            label="Full standings"
            onPress={() => router.push("/standings")}
            style={styles.sectionButton}
          />
        </View>
      ) : (
        <StickerButton
          label="Full standings"
          onPress={() => router.push("/standings")}
        />
      )}

      {typeof total.data === "number" ? (
        <View style={styles.total}>
          <View style={styles.totalRow}>
            <Text style={styles.totalNumber} allowFontScaling={false}>
              {total.data}
            </Text>
            <View>
              <Text style={styles.totalLabel} allowFontScaling={false}>
                TOTAL WEDGIES
              </Text>
              <Text style={styles.totalSince} allowFontScaling={false}>
                FROM THE 2014/15 SEASON
              </Text>
            </View>
          </View>
          <StickerButton
            label="Seasons history"
            onPress={() => router.push("/seasons?from=Home")}
          />
        </View>
      ) : null}
    </View>
  ) : loadError ? null : (
    <View style={styles.loading}>
      <Loader size={112} />
    </View>
  );

  return (
    <TopSafeArea style={styles.safe}>
      <Animated.ScrollView
        ref={shotRef}
        style={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: tabBar }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
            tintColor={colors.cream}
          />
        }
      >
        <View style={styles.header}>
          {/* As on the website's header: the way into the coffees. */}
          <StickerButton
            small
            label="SUPPORT"
            icon={<CoffeeCup width={11} />}
            labelStyle={styles.supportLabel}
            style={styles.support}
            onPress={() => router.push("/support")}
          />
          <Logo width={84} />
        </View>

        {loadError ? (
          <View style={styles.errorWrap}>
            <ErrorState onRetry={refetchAll} />
          </View>
        ) : null}

        {wide ? (
          <StickySplit
            scrollY={scrollY}
            left={hero}
            right={column}
            // The right column's own padding is dropped on this side, so
            // the gap is split evenly either side of the Duo's fold.
            gap={36}
          />
        ) : (
          <>
            {hero}
            {column}
          </>
        )}
      </Animated.ScrollView>
    </TopSafeArea>
  );
}

const TOTAL = 30;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.night },
  scroll: { backgroundColor: colors.night },
  header: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.night,
  },
  support: {
    position: "absolute",
    // In line with the cards below, clear of the screen's rounded corner.
    left: 20,
    flexDirection: "row",
    gap: 6,
    // Tighter than a standard small sticker: it sits in a 52pt header.
    minHeight: 34,
    paddingHorizontal: 9,
    paddingVertical: 0,
  },
  supportLabel: { fontSize: 11, letterSpacing: 1 },
  errorWrap: { padding: space.lg },

  // `bg-night gap-12 px-[18px] pb-12`
  column: {
    backgroundColor: colors.night,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 48,
  },
  section: { width: "100%" },
  // Hero on the left, wedgies and leaders on the right, as on the desktop site.
  columnWide: { paddingTop: 0, paddingLeft: 0 },
  rows: { marginTop: 12, gap: 10 },
  sectionButton: { marginTop: 18 },
  loading: { minHeight: 240, alignItems: "center", justifyContent: "center" },

  total: { gap: 16 },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  totalNumber: {
    fontFamily: fonts.black,
    fontSize: TOTAL * 1.5,
    lineHeight: TOTAL * 1.5,
    color: colors.violet,
  },
  totalLabel: {
    fontFamily: fonts.black,
    fontSize: TOTAL * 0.6,
    lineHeight: TOTAL * 0.6,
    color: colors.cream,
  },
  totalSince: {
    marginTop: TOTAL * 0.4 * 0.2,
    fontFamily: fonts.bold,
    fontSize: TOTAL * 0.4,
    lineHeight: TOTAL * 0.4,
    color: colors.white50,
  },
});
