import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorState, Loading } from "@/components/States";
import { WedgiePlayer } from "@/components/WedgiePlayer";
import { api } from "@/lib/api";
import { colors, radius, space, type } from "@/lib/theme";

/**
 * wedgie.getById is a protected procedure, so the detail screen reads from the
 * same public feed query the list uses - React Query serves it from cache.
 */
export default function WedgieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const latest = api.wedgie.getLatestWedgies.useQuery();

  if (latest.isPending) return <Loading label="Loading wedgie" />;
  if (latest.error) {
    return (
      <View style={styles.padded}>
        <ErrorState message={latest.error.message} />
      </View>
    );
  }

  const wedgie = latest.data?.find((w) => String(w.id) === id);

  if (!wedgie) {
    return (
      <View style={styles.padded}>
        <ErrorState message="That wedgie is not in the latest feed." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <WedgiePlayer videoUrl={wedgie.videoUrl} />

      <View style={styles.header}>
        <Text style={styles.number}>#{wedgie.number}</Text>
        <Text style={styles.player}>{wedgie.playerName}</Text>
        <Text style={styles.matchup}>
          {wedgie.teamName} vs {wedgie.teamAgainstName}
        </Text>
      </View>

      <View style={styles.metaBlock}>
        <Meta label="Season" value={wedgie.seasonName} />
        <Meta label="Date" value={formatDate(wedgie.wedgieDate)} />
        {wedgie.gameName ? (
          <Meta label="Game" value={formatGameName(wedgie.gameName)} />
        ) : null}
        {wedgie.types.length > 0 ? (
          <Meta
            label="Types"
            value={wedgie.types.map((t) => t.name).join(", ")}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

/**
 * Game names are stored as "AWAY @ HOME - <ISO timestamp>". The Date row above
 * already shows the date, so drop the timestamp and keep the matchup.
 */
function formatGameName(value: string): string {
  return value.replace(/\s*-\s*\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/, "").trim();
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkpurple },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  padded: { flex: 1, padding: space.lg, backgroundColor: colors.darkpurple },
  header: { gap: space.xs },
  number: { ...type.label, color: colors.yellow },
  player: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -1,
  },
  matchup: { ...type.body, fontSize: 16, color: colors.muted },
  metaBlock: {
    borderRadius: radius.lg,
    backgroundColor: colors.darkpurpleLight,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: space.lg,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.lg,
    paddingVertical: space.md,
  },
  metaLabel: { ...type.label, fontSize: 11, color: colors.faint },
  metaValue: {
    ...type.body,
    color: colors.white,
    flexShrink: 1,
    textAlign: "right",
  },
});
