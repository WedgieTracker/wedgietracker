import { useId, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { useCountUp } from "@/components/Counter";
import { colors, fonts } from "@/lib/theme";

const RADIUS = 58;
const CENTRE = 70;
const VIEW_W = 140;
const VIEW_H = 80;

/** A point on the arc for a value, where the far end of the arc is `max`. */
function arcPoint(value: number, max: number) {
  const angle = Math.PI * (1 - Math.min(value, max) / max);
  return {
    x: CENTRE + RADIUS * Math.cos(angle),
    y: CENTRE - RADIUS * Math.sin(angle),
  };
}

/**
 * Port of apps/web/src/components/home/PaceGauge.tsx: this season's pace on
 * an arc that ends at the record, so how full it is says how close the season
 * is. Tapping the record opens a note saying which season set it.
 *
 * `hidden` keeps the gauge's shape with its figures left out, for the
 * skeleton, so the real one lands without moving anything.
 */
export function PaceGauge({
  pace,
  record,
  recordSeason,
  hidden = false,
}: {
  pace: number;
  record: number;
  recordSeason: string | null;
  hidden?: boolean;
}) {
  const id = `pace${useId().replace(/:/g, "")}`;
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(0);
  const shown = useCountUp(pace);

  const max = Math.max(record, pace, 1);
  const end = arcPoint(pace, max);
  // The SVG scales to the box; the labels follow it in points.
  const s = width / VIEW_W;

  return (
    <View style={styles.card}>
      <View
        style={styles.dial}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          hidden
            ? undefined
            : `On pace for ${pace} wedgies this season. The record is ${record}.`
        }
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Defs>
            <LinearGradient id={id} x1={0} x2={1} y1={0} y2={0}>
              <Stop offset={0} stopColor="#5f84e6" />
              <Stop offset={1} stopColor="#a65ff5" />
            </LinearGradient>
          </Defs>
          <Path
            d="M12 70A58 58 0 0 1 128 70"
            fill="none"
            stroke="rgba(154, 92, 245, 0.18)"
            strokeWidth={11}
            strokeLinecap="round"
          />
          {pace > 0 && !hidden ? (
            <Path
              d={`M12 70A58 58 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`}
              fill="none"
              stroke={`url(#${id})`}
              strokeWidth={11}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
        {width > 0 ? (
          <>
            <Text
              style={[
                styles.caption,
                {
                  fontSize: 8.5 * s,
                  lineHeight: 8.5 * s,
                  top: (36 - 8.5 * 0.78) * s,
                },
                hidden && styles.hidden,
              ]}
              allowFontScaling={false}
            >
              On pace for
            </Text>
            <Text
              style={[
                styles.number,
                {
                  fontSize: 36 * s,
                  lineHeight: 36 * s,
                  letterSpacing: -1.4 * s,
                  top: (70 - 36 * 0.76) * s,
                },
                hidden && styles.hidden,
              ]}
              allowFontScaling={false}
            >
              {shown}
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.ends}>
        <Text
          style={[styles.zero, hidden && styles.hidden]}
          allowFontScaling={false}
        >
          0
        </Text>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          disabled={hidden}
          hitSlop={{ top: 8, bottom: 8, left: 26, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`${record}: what is this?`}
          accessibilityState={{ expanded: open }}
          style={styles.record}
        >
          <View style={[styles.info, hidden && styles.hidden]}>
            <Text style={styles.infoText} allowFontScaling={false}>
              i
            </Text>
          </View>
          <Text
            style={[styles.recordText, hidden && styles.hidden]}
            allowFontScaling={false}
          >
            {record}
          </Text>
        </Pressable>

        {open ? (
          <Pressable
            onPress={() => setOpen(false)}
            style={styles.note}
            accessibilityRole="text"
          >
            <Text style={styles.noteText}>
              <Text style={styles.noteStrong}>{record} is the record.</Text> The
              most wedgies in a season
              {recordSeason ? `, set in ${recordSeason}` : ""}.
            </Text>
            <View style={styles.noteArrow} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // `bg-panel border-violet/20 rounded-[20px] border px-3.5 pt-[18px] pb-3`
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.violet20,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
  },
  dial: {
    width: "100%",
    maxWidth: 245,
    alignSelf: "center",
    aspectRatio: VIEW_W / VIEW_H,
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: fonts.bold,
    color: colors.cream70,
  },
  number: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: fonts.blackItalic,
    color: colors.cream,
  },
  hidden: { opacity: 0 },

  ends: {
    marginTop: 4,
    height: 26,
    width: "100%",
    maxWidth: 245,
    alignSelf: "center",
  },
  zero: {
    position: "absolute",
    left: "8.57%",
    width: 20,
    marginLeft: -10,
    top: 5,
    textAlign: "center",
    fontFamily: fonts.extraBold,
    fontSize: 12,
    color: colors.cream50,
  },
  // Centred on the arc's far end, with the ⓘ hanging to its left.
  record: {
    position: "absolute",
    left: "91.43%",
    width: 40,
    marginLeft: -20,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    position: "absolute",
    right: 36,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.6,
    borderColor: colors.cream50,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontFamily: "Georgia-BoldItalic",
    fontSize: 10.5,
    lineHeight: 12,
    color: colors.cream70,
  },
  recordText: { fontFamily: fonts.black, fontSize: 14, color: colors.cream },

  note: {
    position: "absolute",
    left: -8,
    right: -8,
    bottom: 36,
    zIndex: 20,
    backgroundColor: colors.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#050214",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
  },
  noteText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.night,
  },
  noteStrong: { fontFamily: fonts.black },
  // Points at the record, like the web's rotated square.
  noteArrow: {
    position: "absolute",
    bottom: -5,
    right: "8.57%",
    width: 12,
    height: 12,
    marginRight: 2,
    borderRadius: 2,
    backgroundColor: colors.cream,
    transform: [{ rotate: "45deg" }],
  },
});
