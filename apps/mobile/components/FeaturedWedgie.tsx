import { Pressable, StyleSheet, Text, View } from "react-native";

import { CourtPositionDiagram } from "@/components/CourtPositionDiagram";
import { GradientFill, Grain } from "@/components/Gradient";
import { PlayButton } from "@/components/PlayButton";
import type { WedgieRowData } from "@/components/WedgieRow";
import { shortDate } from "@/lib/dates";
import { badgeTextShadow, colors, fonts } from "@/lib/theme";
import { gameTimeline } from "@wedgietracker/core/utils/gameMoment";

export interface FeaturedWedgieData extends WedgieRowData {
  period: number | null;
  gameClock: string | null;
  teamScore: number | null;
  opponentScore: number | null;
}

/** The quarters bar, in cream for the badge. */
function QuartersBar({ wedgie }: { wedgie: FeaturedWedgieData }) {
  const timeline = gameTimeline({
    period: wedgie.period,
    gameClock: wedgie.gameClock,
    teamScore: wedgie.teamScore,
    opponentScore: wedgie.opponentScore,
    types: wedgie.types,
  });
  if (!timeline) return null;

  return (
    <View
      style={styles.quarters}
      accessible
      accessibilityLabel={`When: ${timeline.label}`}
    >
      <View style={styles.segments}>
        {timeline.segments.map((segment, i) => {
          const active = i === timeline.active;
          const filled =
            i < timeline.active ? 1 : active ? timeline.progress : 0;
          return (
            <View key={segment} style={styles.segment}>
              <View style={styles.track}>
                <View
                  style={[styles.trackFill, { width: `${filled * 100}%` }]}
                />
                {active ? (
                  <View
                    style={[
                      styles.marker,
                      { left: `${timeline.progress * 100}%` },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[styles.segmentLabel, active && styles.segmentActive]}
                allowFontScaling={false}
              >
                {segment}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.quartersLabel} allowFontScaling={false}>
        {timeline.label}
      </Text>
    </View>
  );
}

/**
 * Port of apps/web/src/components/home/FeaturedWedgie.tsx: the newest wedgie,
 * bigger than the rows below it. The badge with its number, date, court and
 * the moment in the game, then who and against whom.
 */
export function FeaturedWedgie({
  wedgie,
  onPress,
}: {
  wedgie: FeaturedWedgieData;
  onPress: () => void;
}) {
  const opponent = wedgie.teamAgainstName.includes("Unknown")
    ? null
    : wedgie.teamAgainstName;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Watch wedgie ${wedgie.number}, ${wedgie.playerName}`}
      style={({ pressed }) => [styles.frame, pressed && styles.framePressed]}
    >
      {/* The 1.5pt glow border. */}
      <GradientFill name="glow" radius={24} />
      <View style={styles.card}>
        <View style={styles.badge}>
          <GradientFill name="badge" />
          <Grain />
          <View style={styles.badgeTop}>
            <View>
              <Text
                style={[styles.number, badgeTextShadow(58)]}
                allowFontScaling={false}
              >
                <Text style={styles.hash}>#</Text>
                {wedgie.number ?? 1}
              </Text>
              <Text style={styles.date} allowFontScaling={false}>
                {shortDate(wedgie.wedgieDate)}
              </Text>
            </View>
            <CourtPositionDiagram
              position={wedgie.position}
              width={150}
              dotSize={10}
            />
          </View>
          <QuartersBar wedgie={wedgie} />
        </View>

        <View style={styles.info}>
          <View style={styles.play}>
            <PlayButton size="lg" />
          </View>
          <Text
            style={styles.player}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {wedgie.playerName}
          </Text>
          <Text style={styles.teams} allowFontScaling={false}>
            <Text style={styles.teamCode}>{wedgie.teamName}</Text>
            {opponent ? ` vs ${opponent}` : ""}
          </Text>
          <View style={styles.chips}>
            {wedgie.types.map((type) => (
              <View key={type.name} style={styles.chip}>
                <Text style={styles.chipText} allowFontScaling={false}>
                  {type.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 24, padding: 1.5 },
  framePressed: { opacity: 0.85 },
  card: {
    borderRadius: 22.5,
    overflow: "hidden",
    backgroundColor: colors.panel,
  },
  badge: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  badgeTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  number: {
    fontFamily: fonts.blackItalic,
    fontSize: 58,
    lineHeight: 58,
    letterSpacing: -2.3,
    color: colors.cream,
  },
  hash: {
    fontSize: 24,
    letterSpacing: 0,
    color: "rgba(240, 225, 182, 0.55)",
    textShadowRadius: 0,
    textShadowOffset: { width: 0, height: 0 },
  },
  date: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.cream70,
  },

  quarters: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.cream20,
  },
  segments: { flexDirection: "row", gap: 5 },
  segment: { flex: 1 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.cream20 },
  trackFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 3,
    backgroundColor: "rgba(240, 225, 182, 0.55)",
  },
  // A cream dot ringed in the badge's indigo.
  marker: {
    position: "absolute",
    top: -7,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "rgba(54, 55, 141, 0.9)",
    backgroundColor: colors.cream,
    shadowColor: colors.cream,
    shadowOpacity: 0.6,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  segmentLabel: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: fonts.extraBold,
    fontSize: 11,
    color: colors.cream50,
  },
  segmentActive: { color: colors.cream },
  quartersLabel: {
    marginTop: 8,
    fontFamily: fonts.black,
    fontSize: 13,
    color: colors.cream,
  },

  info: { padding: 18 },
  play: { position: "absolute", top: 22, right: 18 },
  player: {
    paddingRight: 52,
    fontFamily: fonts.black,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.2,
    color: colors.cream,
  },
  teams: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.cream80,
  },
  teamCode: { fontFamily: fonts.black, color: colors.violet },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: {
    backgroundColor: colors.violet15,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    color: colors.cream,
  },
});
