import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FilterPill, FilterSheet, OptionRow } from "@/components/FilterSheet";
import { GradientFill, Grain } from "@/components/Gradient";
import { PageHeading } from "@/components/PageHeading";
import { Screen } from "@/components/Screen";
import { ErrorState } from "@/components/States";
import { StickerButton } from "@/components/StickerButton";
import { SupportFooter } from "@/components/SupportFooter";
import { api, type RouterOutputs } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";
import { useWide } from "@/lib/wide";
import { TEAMS } from "@wedgietracker/core/utils/teamAliases";

type SeasonStats = RouterOutputs["season"]["getAllWithStats"][number];
interface Lead {
  names: string[];
  count: number;
}

const SORTS: {
  label: string;
  compare: (a: SeasonStats, b: SeasonStats) => number;
}[] = [
  { label: "Newest first", compare: (a, b) => b.name.localeCompare(a.name) },
  { label: "Oldest first", compare: (a, b) => a.name.localeCompare(b.name) },
  { label: "Most wedgies", compare: (a, b) => b.totalWedgies - a.totalWedgies },
  {
    label: "Fewest wedgies",
    compare: (a, b) => a.totalWedgies - b.totalWedgies,
  },
  { label: "Most games", compare: (a, b) => b.totalGames - a.totalGames },
  { label: "Fewest games", compare: (a, b) => a.totalGames - b.totalGames },
];

const GAP = 14;

const teamName = (code: string) =>
  TEAMS.find((t) => t.code === code)?.fullName ?? code;

/**
 * Everyone tied for the most. Servers from before the redesign only send the
 * top five, so the ties are worked out from those when `lead` is missing.
 */
function leadOf(
  lead: Lead | undefined,
  top: { name: string; count: number }[],
): Lead {
  if (lead) return lead;
  const count = top[0]?.count ?? 0;
  return {
    names: count ? top.filter((t) => t.count === count).map((t) => t.name) : [],
    count,
  };
}

/** The leader's name, or how many tied when it's more than one. */
function leader(lead: Lead, full = false) {
  if (!lead.names.length) return "None yet";
  if (lead.names.length > 1) return `${lead.names.length} tied`;
  return full ? teamName(lead.names[0]!) : lead.names[0]!;
}

/**
 * Port of apps/web/src/components/seasons-history: every season with a
 * wedgie as a card, in an order that can be changed. Two columns on a wide
 * screen.
 */
export default function SeasonsScreen() {
  // Reachable from the Home hero and from Stats, so the back label has to name
  // whichever one pushed it rather than being fixed in the layout.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const seasons = api.season.getAllWithStats.useQuery();
  const global = api.admin.getGlobal.useQuery();
  const [sort, setSort] = useState(0);
  const [open, setOpen] = useState(false);
  const { wide, width } = useWide();
  const columns = wide ? 2 : 1;
  const cardWidth =
    (Math.min(width, 1000) - 32 - GAP * (columns - 1)) / columns;

  const current = global.data?.currentSeason?.name;
  const shown = (seasons.data ?? [])
    .filter((s) => s.totalWedgies > 0)
    .sort((a, b) => SORTS[sort]!.compare(a, b) || b.name.localeCompare(a.name));

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: from ?? "Back" }} />
      <Screen
        underHeader
        heading={<PageHeading title="Seasons history" />}
        refreshControl={
          <RefreshControl
            refreshing={seasons.isRefetching}
            onRefresh={() => void seasons.refetch()}
            tintColor={colors.cream}
          />
        }
      >
        <View style={[styles.sortRow, seasons.isPending && styles.dim]}>
          <FilterPill
            label={sort === 0 ? "Sort" : SORTS[sort]!.label}
            set={sort !== 0}
            open={open}
            disabled={seasons.isPending}
            onPress={() => setOpen(true)}
            accessibilityLabel={`Sort: ${SORTS[sort]!.label}`}
          />
        </View>
        <FilterSheet
          title="Sort seasons"
          visible={open}
          onClose={() => setOpen(false)}
        >
          {SORTS.map((s, i) => (
            <OptionRow
              key={s.label}
              label={s.label}
              on={sort === i}
              onPick={() => {
                setSort(i);
                setOpen(false);
              }}
            />
          ))}
        </FilterSheet>

        {seasons.error ? (
          <ErrorState onRetry={() => void seasons.refetch()} />
        ) : null}

        <View style={styles.grid}>
          {seasons.isPending
            ? // Card-sized placeholders, so the grid lands without moving.
              Array.from({ length: 4 }, (_, i) => (
                <View
                  key={i}
                  style={[styles.placeholder, { width: cardWidth }]}
                />
              ))
            : shown.map((season) => (
                <SeasonCard
                  key={season.name}
                  season={season}
                  live={(season.isCurrent ?? false) || season.name === current}
                  width={cardWidth}
                />
              ))}
        </View>
        <SupportFooter />
      </Screen>
    </>
  );
}

/**
 * One season: how many wedgies, the games played top right, a strip of N
 * games with the last lit up for how often a wedgie happened, the leading
 * player and team, and links to watch that season's wedgies or open its
 * leaderboard. The season in progress sits on the badge gradient.
 */
function SeasonCard({
  season,
  live,
  width,
}: {
  season: SeasonStats;
  live: boolean;
  width: number;
}) {
  const router = useRouter();
  const perWedgie = Math.max(
    1,
    Math.round(season.totalGames / season.totalWedgies),
  );
  const players = leadOf(season.leadPlayers, season.topPlayers);
  const teams = leadOf(season.leadTeams, season.topTeams);

  return (
    <View
      style={[styles.card, live ? styles.cardLive : styles.cardIdle, { width }]}
    >
      {live ? (
        <>
          <GradientFill name="badge" radius={22} />
          <Grain radius={22} />
        </>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.name} allowFontScaling={false}>
          {season.name}
        </Text>
        {live ? (
          <View style={styles.live}>
            <Text style={styles.liveText} allowFontScaling={false}>
              IN PROGRESS
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.figures}>
        <View>
          <Text style={styles.big} allowFontScaling={false}>
            {season.totalWedgies}
          </Text>
          <Text style={styles.label} allowFontScaling={false}>
            WEDGIES
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.games} allowFontScaling={false}>
            {season.totalGames.toLocaleString("en-US")}
          </Text>
          <Text
            style={[styles.label, styles.alignRight]}
            allowFontScaling={false}
          >
            {live ? "GAMES SO FAR" : "GAMES TOTAL"}
          </Text>
        </View>
      </View>

      <View accessible accessibilityLabel={`1 wedgie every ${perWedgie} games`}>
        <View style={styles.strip}>
          {Array.from({ length: perWedgie }, (_, i) => (
            <View
              key={i}
              style={[
                styles.game,
                i === perWedgie - 1 ? styles.gameLit : styles.gameIdle,
              ]}
            />
          ))}
        </View>
        <Text style={styles.every} allowFontScaling={false}>
          1 wedgie every{" "}
          <Text style={styles.everyStrong}>{perWedgie} games</Text>
        </Text>
      </View>

      <View>
        {(
          [
            ["PLAYER", leader(players), players.count],
            ["TEAM", leader(teams, true), teams.count],
          ] as const
        ).map(([label, name, n]) => (
          <View
            key={label}
            style={[styles.lead, live ? styles.leadLive : styles.leadIdle]}
          >
            <Text style={styles.leadLabel} allowFontScaling={false}>
              {label}
            </Text>
            <Text
              style={styles.leadName}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {name}
              {n ? ` · ${n}` : ""}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.links}>
        <StickerButton
          label="▶ Watch them"
          small
          variant={live ? "dark" : "violet"}
          style={styles.link}
          onPress={() =>
            router.push({
              pathname: "/all-wedgies",
              params: { ws: season.name },
            })
          }
        />
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.link,
            styles.outline,
            pressed && styles.outlinePressed,
          ]}
          onPress={() =>
            router.push({
              pathname: "/standings",
              params: { season: season.name.replace("/", "-") },
            })
          }
        >
          <Text style={styles.outlineText} allowFontScaling={false}>
            Leaderboard
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const PINK = "#FF6FD8";

const styles = StyleSheet.create({
  sortRow: { marginTop: 24, marginBottom: 14, alignItems: "flex-end" },
  dim: { opacity: 0.4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  placeholder: {
    height: 330,
    borderRadius: 22,
    backgroundColor: "rgba(29, 18, 66, 0.6)",
  },

  // `flex flex-col gap-3.5 rounded-[22px] border p-4`
  card: { gap: 14, padding: 16, borderRadius: 22, borderWidth: 1 },
  cardIdle: { backgroundColor: colors.panel, borderColor: colors.violet20 },
  cardLive: { borderColor: "rgba(240, 225, 182, 0.35)", overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontFamily: fonts.black, fontSize: 17, color: colors.cream },
  live: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(240, 225, 182, 0.2)",
  },
  liveText: {
    fontFamily: fonts.black,
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: colors.cream,
  },

  figures: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  right: { alignItems: "flex-end" },
  // Italic numbers lean right, so no negative tracking and a little room on
  // the right keeps them from looking clipped or off-centre.
  big: {
    fontFamily: fonts.numerals,
    fontSize: 58,
    lineHeight: 70,
    paddingRight: 6,
    color: colors.cream,
  },
  games: {
    fontFamily: fonts.numerals,
    fontSize: 30,
    lineHeight: 36,
    paddingRight: 3,
    color: colors.cream,
  },
  label: {
    marginTop: 6,
    fontFamily: fonts.black,
    fontSize: 11.5,
    letterSpacing: 1.6,
    color: "rgba(240, 225, 182, 0.6)",
  },
  alignRight: { textAlign: "right" },

  strip: { flexDirection: "row", alignItems: "center", gap: 2 },
  game: { flex: 1, height: 14, borderRadius: 3 },
  gameIdle: { backgroundColor: "rgba(240, 225, 182, 0.15)" },
  gameLit: {
    backgroundColor: PINK,
    shadowColor: PINK,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  every: {
    marginTop: 6,
    textAlign: "right",
    fontFamily: fonts.extraBold,
    fontSize: 11.5,
    color: "rgba(240, 225, 182, 0.6)",
  },
  everyStrong: { color: colors.cream },

  lead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
  },
  leadIdle: { borderTopColor: colors.violet20 },
  leadLive: { borderTopColor: colors.cream20 },
  leadLabel: {
    fontFamily: fonts.black,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "rgba(240, 225, 182, 0.55)",
  },
  leadName: {
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: colors.cream,
  },

  links: { flexDirection: "row", gap: 8 },
  link: { flex: 1, alignSelf: "auto" },
  outline: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(240, 225, 182, 0.45)",
  },
  outlinePressed: { borderColor: colors.cream },
  outlineText: { fontFamily: fonts.black, fontSize: 13, color: colors.cream },
});
