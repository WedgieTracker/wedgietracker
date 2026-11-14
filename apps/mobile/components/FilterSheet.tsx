import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { GradientFill } from "@/components/Gradient";
import { colors, fonts } from "@/lib/theme";

/**
 * Port of apps/web/src/components/shared/FilterPopover.tsx. On the web a
 * pill opens a popover under it; on a phone the same list rises as a bottom
 * sheet, closer to the thumb.
 */

/** A filter pill that opens a sheet. It turns cream once it's set. */
export function FilterPill({
  label,
  set,
  open,
  onPress,
  accessibilityLabel,
  disabled = false,
  sizeFor,
  children,
}: {
  label: string;
  set: boolean;
  open: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  /** Keep the pill as wide as this text, so filling it in moves nothing. */
  sizeFor?: string;
  /** Extra content after the label, like a switch. */
  children?: React.ReactNode;
}) {
  const text = (
    <Text
      style={[styles.pillText, set && styles.pillTextOn]}
      allowFontScaling={false}
    >
      {label}
    </Text>
  );
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open }}
      style={({ pressed }) => [
        styles.pill,
        set && styles.pillOn,
        pressed && !set && styles.pillPressed,
      ]}
    >
      {sizeFor ? (
        <View>
          <Text
            style={[styles.pillText, styles.invisible]}
            allowFontScaling={false}
          >
            {sizeFor}
          </Text>
          <View style={styles.overlay}>{text}</View>
        </View>
      ) : (
        text
      )}
      {children ?? (
        <Text
          style={[styles.caret, set && styles.pillTextOn]}
          allowFontScaling={false}
        >
          ▾
        </Text>
      )}
    </Pressable>
  );
}

/** The sheet itself: a title, then its rows, over a dimmed page. */
export function FilterSheet({
  title,
  visible,
  onClose,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <Animated.View
          entering={SlideInDown.duration(240)}
          style={[
            styles.sheet,
            { paddingBottom: bottom + 8, maxHeight: height * 0.78 },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <Text
              style={styles.sheetTitle}
              accessibilityRole="header"
              allowFontScaling={false}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Done"
              style={({ pressed }) => [
                styles.done,
                pressed && styles.donePressed,
              ]}
            >
              <Text style={styles.doneText} allowFontScaling={false}>
                Done
              </Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.sheetBody}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** A small cut gem, marking GEMS (wedgies that sit outside the seasons). */
export function GemIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12">
      <Path d="M3 1.5h6L11 4.5 6 10.5 1 4.5z" fill="#9BE7FF" />
      <Path
        d="M1 4.5h10M4.2 1.5 6 4.5l1.8-3M6 4.5v6"
        stroke="rgba(20, 10, 46, 0.35)"
        strokeWidth={0.7}
        fill="none"
      />
    </Svg>
  );
}

/** A small heading inside a sheet, like "Seasons". */
export function GroupLabel({ children }: { children: string }) {
  return (
    <Text style={styles.group} allowFontScaling={false}>
      {children.toUpperCase()}
    </Text>
  );
}

/**
 * One choice: its name, a bar for how many wedgies it has against the
 * biggest in the list, the count, and a tick when chosen. The Any row
 * (value "") has no bar, and a choice with nothing in it is dimmed.
 */
export function CountRow({
  value,
  label,
  count,
  max,
  on,
  onPick,
}: {
  value: string;
  label: string;
  count: number;
  max: number;
  on: boolean;
  onPick: () => void;
}) {
  const width = max ? Math.max(count ? 4 : 0, (count / max) * 100) : 0;
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count} ${count === 1 ? "wedgie" : "wedgies"}`}
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [
        styles.row,
        on && styles.rowOn,
        !on && pressed && styles.rowPressed,
        !on && !count && styles.rowEmpty,
      ]}
    >
      <View style={styles.rowLabel}>
        {value === "GEMS" ? <GemIcon /> : null}
        <Text
          style={[styles.rowText, on && styles.rowTextOn]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </View>
      <View
        style={[styles.bar, on && styles.barOn, !value && styles.invisible]}
      >
        {on ? (
          <View
            style={[styles.barFill, styles.barFillOn, { width: `${width}%` }]}
          />
        ) : (
          <View style={[styles.barFill, { width: `${width}%` }]}>
            <GradientFill name="button" radius={3} />
          </View>
        )}
      </View>
      <Text
        style={[styles.count, on && styles.countOn]}
        allowFontScaling={false}
      >
        {count}
      </Text>
      <Text
        style={[styles.tick, on && styles.rowTextOn]}
        allowFontScaling={false}
      >
        {on ? "✓" : ""}
      </Text>
    </Pressable>
  );
}

/** One plain choice, like a sort order, with a tick when chosen. */
export function OptionRow({
  label,
  on,
  onPick,
}: {
  label: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [
        styles.row,
        styles.option,
        on && styles.rowOn,
        !on && pressed && styles.rowPressed,
      ]}
    >
      <Text
        style={[styles.rowText, on && styles.rowTextOn]}
        allowFontScaling={false}
      >
        {label}
      </Text>
      <Text
        style={[styles.tick, on && styles.rowTextOn]}
        allowFontScaling={false}
      >
        {on ? "✓" : ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // `min-h-10 rounded-xl border px-3 text-[13.5px] font-extrabold`
  pill: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(154, 92, 245, 0.3)",
    backgroundColor: colors.panel,
  },
  pillOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  pillPressed: { borderColor: "rgba(240, 225, 182, 0.6)" },
  pillText: {
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: colors.cream,
  },
  pillTextOn: { color: colors.night },
  caret: { fontSize: 11, color: colors.cream, opacity: 0.6 },
  invisible: { opacity: 0 },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },

  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(5, 2, 20, 0.6)",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(154, 92, 245, 0.35)",
    backgroundColor: colors.panel,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    marginTop: 8,
    borderRadius: 3,
    backgroundColor: "rgba(240, 225, 182, 0.3)",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetTitle: { fontFamily: fonts.black, fontSize: 19, color: colors.cream },
  done: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.violet20,
  },
  donePressed: { backgroundColor: colors.violet60 },
  doneText: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.cream },
  scroll: { flexGrow: 0, flexShrink: 1 },
  sheetBody: { paddingHorizontal: 10, paddingBottom: 8 },

  group: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    fontFamily: fonts.black,
    fontSize: 11,
    letterSpacing: 0.9,
    color: "rgba(240, 225, 182, 0.45)",
  },

  // `grid-cols-[7.5rem_1fr_30px_14px] min-h-10 rounded-[10px] px-2.5`
  row: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  option: { justifyContent: "space-between" },
  rowOn: { backgroundColor: colors.cream },
  rowPressed: { backgroundColor: colors.violet15 },
  rowEmpty: { opacity: 0.4 },
  rowLabel: { width: 132, flexDirection: "row", alignItems: "center", gap: 6 },
  rowText: {
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: "rgba(240, 225, 182, 0.85)",
  },
  rowTextOn: { color: colors.night },
  bar: {
    flex: 1,
    height: 6,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: colors.violet20,
  },
  barOn: { backgroundColor: "rgba(20, 10, 46, 0.15)" },
  barFill: { height: "100%", borderRadius: 3, overflow: "hidden" },
  barFillOn: { backgroundColor: colors.night },
  count: {
    width: 34,
    textAlign: "right",
    fontFamily: fonts.extraBold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    color: "rgba(240, 225, 182, 0.55)",
  },
  countOn: { color: "rgba(20, 10, 46, 0.6)" },
  tick: { width: 14, fontSize: 14, color: colors.cream },
});
