import { useRouter } from "expo-router";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeroStats } from "@/components/HeroStats";
import { PillButton } from "@/components/PillButton";
import { StandingsList } from "@/components/StandingsList";
import { ErrorState, Loading } from "@/components/States";
import { WedgieRow } from "@/components/WedgieRow";
import { useFluidType } from "@/lib/fluid";
import { api } from "@/lib/api";
import { colors, fonts, radius, space } from "@/lib/theme";

/**
 * Mirrors the composition of apps/web/src/app/page.tsx: the stats hero, the
 * latest three wedgies, the standings summary, then the all-time total.
 */
export default function HomeScreen() {
  const router = useRouter();
  const t = useFluidType();

  const stats = api.wedgie.getStats.useQuery();
  const latest = api.wedgie.getLatestWedgies.useQuery();
  const standings = api.wedgie.getTopStandings.useQuery();
  const total = api.wedgie.getTotalWedgies.useQuery();

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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
            tintColor={colors.yellow}
          />
        }
      >
        {stats.isPending ? (
          <View style={styles.heroFallback}>
            <Loading label="Loading wedgies" />
          </View>
        ) : null}

        {stats.error ? (
          <View style={styles.errorWrap}>
            <ErrorState message={stats.error.message} />
          </View>
        ) : null}

        {stats.data ? (
          <HeroStats
            stats={stats.data}
            onMoreStats={() => router.push("/stats")}
          />
        ) : null}

        <View style={styles.column}>
          {latest.data && latest.data.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardBody}>
                {latest.data.slice(0, 3).map((wedgie, index, rows) => (
                  <WedgieRow
                    key={wedgie.id}
                    wedgie={wedgie}
                    first={index === 0}
                    last={index === rows.length - 1}
                    onPress={() => router.push(`/wedgie/${wedgie.id}`)}
                  />
                ))}
              </View>
              <PillButton
                label="WATCH THEM ALL"
                variant="bar"
                onPress={() => router.push("/all-wedgies")}
              />
            </View>
          ) : null}

          {/* The web page hides the tables entirely until the season opens. */}
          {standings.data ? (
            standings.data.hasWedgiesThisSeason ? (
              <View style={styles.standingsCard}>
                <View style={styles.standingsGrid}>
                  <View style={styles.standingsPlayers}>
                    <StandingsList
                      title="PLAYERS"
                      items={standings.data.players}
                    />
                  </View>
                  <View style={styles.standingsTeams}>
                    <StandingsList title="TEAMS" items={standings.data.teams} />
                  </View>
                </View>
                <PillButton
                  label="SEE STANDINGS"
                  variant="bar"
                  onPress={() => router.push("/standings")}
                />
              </View>
            ) : (
              <PillButton
                label="SEE STANDINGS"
                onPress={() => router.push("/standings")}
              />
            )
          ) : null}

          {typeof total.data === "number" ? (
            <View style={styles.totalBlock}>
              <View style={styles.totalRow}>
                <Text
                  style={[
                    styles.totalNumber,
                    { fontSize: t.wedgiesText * 1.5 },
                  ]}
                  allowFontScaling={false}
                >
                  {total.data}
                </Text>
                <View style={styles.totalLabels}>
                  <Text
                    style={[
                      styles.totalLabel,
                      { fontSize: t.wedgiesText * 0.6 },
                    ]}
                    allowFontScaling={false}
                  >
                    TOTAL WEDGIES
                  </Text>
                  <Text
                    style={[
                      styles.totalSince,
                      { fontSize: t.wedgiesText * 0.4 },
                    ]}
                    allowFontScaling={false}
                  >
                    FROM THE 2014/15 SEASON
                  </Text>
                </View>
              </View>
              <PillButton
                label="SEASONS HISTORY"
                onPress={() => router.push("/seasons")}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkpurple },
  content: { paddingBottom: space.xxl },
  heroFallback: {
    minHeight: 400,
    backgroundColor: colors.darkpurpleLight,
    justifyContent: "center",
  },
  errorWrap: { padding: space.lg },

  // The dark column that holds the lists on the web page.
  column: {
    backgroundColor: colors.darkpurpleDark,
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
    gap: 48,
    alignItems: "center",
  },

  card: {
    width: "100%",
    maxWidth: 672,
    backgroundColor: colors.darkpurple,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  cardBody: { padding: space.sm },

  standingsCard: {
    width: "100%",
    maxWidth: 672,
    backgroundColor: colors.rowIdle,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  standingsGrid: {
    flexDirection: "row",
    gap: space.xl,
    padding: space.sm,
    paddingVertical: space.md,
  },
  // 3/5 and 2/5 of the grid, as on the web
  standingsPlayers: { flex: 3 },
  standingsTeams: { flex: 2 },

  totalBlock: {
    width: "100%",
    maxWidth: 672,
    alignItems: "center",
    gap: space.lg,
  },
  totalRow: { flexDirection: "row", alignItems: "center", gap: space.lg },
  totalNumber: { fontFamily: fonts.black, color: colors.yellow },
  totalLabels: { gap: 2 },
  totalLabel: { fontFamily: fonts.black, color: colors.pink },
  totalSince: { fontFamily: fonts.bold, color: colors.white50 },
});
