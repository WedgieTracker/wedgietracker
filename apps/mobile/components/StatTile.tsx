import { StyleSheet, Text, View } from "react-native";

import { colors, radius, space, type } from "@/lib/theme";

interface StatTileProps {
  label: string;
  value: string | number;
  accent?: "yellow" | "pink" | "white";
  wide?: boolean;
}

export function StatTile({
  label,
  value,
  accent = "yellow",
  wide = false,
}: StatTileProps) {
  return (
    <View style={[styles.tile, wide && styles.wide]}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: colors[accent] }]}>{value}</Text>
    </View>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.darkpurpleLight,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: space.sm,
  },
  wide: { flexBasis: "100%" },
  label: { ...type.label, fontSize: 11, color: colors.muted },
  value: { ...type.stat },
});
