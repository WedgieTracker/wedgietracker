import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, space, type } from "@/lib/theme";

export interface WedgieCardData {
  id: number;
  number: number;
  playerName: string;
  teamName: string;
  teamAgainstName: string;
  wedgieDate: string;
  types: { name: string }[];
}

export function WedgieCard({ wedgie }: { wedgie: WedgieCardData }) {
  return (
    <Link href={`/wedgie/${wedgie.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.numberColumn}>
          <Text style={styles.number}>{wedgie.number}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.player} numberOfLines={1}>
            {wedgie.playerName}
          </Text>
          <Text style={styles.matchup} numberOfLines={1}>
            {wedgie.teamName} vs {wedgie.teamAgainstName}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.date}>
              {formatWedgieDate(wedgie.wedgieDate)}
            </Text>
            {wedgie.types.slice(0, 2).map((t) => (
              <View key={t.name} style={styles.tag}>
                <Text style={styles.tagText}>{t.name.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function formatWedgieDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: space.md,
    padding: space.md,
    marginBottom: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.darkpurpleLight,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardPressed: { backgroundColor: colors.darkpurpleLighter },
  numberColumn: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.darkpurple,
  },
  number: {
    ...type.label,
    fontSize: 20,
    fontWeight: "900",
    color: colors.yellow,
  },
  body: { flex: 1, gap: 2 },
  player: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -0.4,
  },
  matchup: { ...type.body, color: colors.muted },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.sm,
    flexWrap: "wrap",
  },
  date: { ...type.label, color: colors.faint },
  tag: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 0, 255, 0.18)",
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.pink,
    letterSpacing: 0.5,
  },
});
