import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FeaturedWedgie } from "@/components/FeaturedWedgie";
import { HeroStats } from "@/components/HeroStats";
import { Loader } from "@/components/Loader";
import { Logo } from "@/components/Logo";
import { PlayersTeams } from "@/components/PlayersTeams";
import { ErrorState } from "@/components/States";
import { StickerButton } from "@/components/StickerButton";
import { TopSafeArea } from "@/components/TopSafeArea";
import { WedgieRow } from "@/components/WedgieRow";
import { api } from "@/lib/api";
import { useTabBarClearance } from "@/lib/layout";
import { colors, fonts, space } from "@/lib/theme";
import { heroForScreenshot, latestForScreenshot } from "@/lib/screenshot";

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

  const stats = api.wedgie.getStats.useQuery();
  const latest = api.wedgie.getLatestWedgies.useQuery();
  const standings = api.wedgie.getTopStandings.useQuery();
  const total = api.wedgie.getTotalWedgies.useQuery();
  const seasons = api.season.getAllWithStats.useQuery();

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
  };

  const loadError =
    stats.error ?? latest.error ?? standings.error ?? total.error;
  const columnReady = latest.data && standings.data && total.data !== undefined;

  const rows = latest.data ? latestForScreenshot(latest.data).slice(0, 3) : [];
  const [first, ...rest] = rows;

  return (
    <TopSafeArea style={styles.safe}>
      <ScrollView
        style={styles.scroll}
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
          <Logo width={84} />
        </View>

        {loadError ? (
          <View style={styles.errorWrap}>
            <ErrorState onRetry={refetchAll} />
          </View>
        ) : null}

        <HeroStats
          stats={stats.data ? heroForScreenshot(stats.data) : null}
          recordSeason={recordSeason}
          onMoreStats={() => router.push("/stats")}
        />

        {columnReady ? (
          <View style={styles.column}>
            {first ? (
              <View style={styles.section}>
                <Text style={styles.heading} allowFontScaling={false}>
                  Latest wedgies
                </Text>
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

            {/* The web hides the leaders until the season has a wedgie. */}
            {standings.data?.hasWedgiesThisSeason ? (
              <View style={styles.section}>
                <Text style={styles.heading} allowFontScaling={false}>
                  Leaders
                </Text>
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
        )}
      </ScrollView>
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
  heading: {
    marginBottom: 16,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.2,
    color: colors.cream,
  },
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
