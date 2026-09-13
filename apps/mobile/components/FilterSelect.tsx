import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { track } from "@/lib/observability";
import { colors, fonts, radius, space } from "@/lib/theme";

export interface FilterOption {
  /** Empty string means "no filter", matching the web's `<option value="">`. */
  value: string;
  label: string;
}

/**
 * The web filters are `<select>` dropdowns. A horizontal row of chips is the
 * obvious native translation but it scrolls the current choice out of view and
 * clips at the container edge, so this opens a sheet instead - the same shape
 * as the dropdown it replaces.
 */
export function FilterSelect({
  label,
  value,
  options,
  onSelect,
  tone = "yellow",
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  tone?: "yellow" | "pink";
}) {
  const [open, setOpen] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const active = value !== "";
  // Falling back to options[0] was wrong while the option list is still
  // loading: a real season would display as "All Seasons", claiming a filter
  // that is not the one applied. Show the value itself until its option
  // arrives, and only fall back for the genuinely empty case.
  const matched = options.find((o) => o.value === value);
  const currentLabel =
    matched?.label ?? (value !== "" ? value : (options[0]?.label ?? ""));

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          !active && tone === "pink" && styles.fieldPink,
          pressed && styles.fieldPressed,
        ]}
      >
        <View style={styles.fieldHead}>
          <Text
            style={[
              styles.fieldLabel,
              !active && tone === "pink" && styles.pink,
            ]}
            allowFontScaling={false}
          >
            {label}
          </Text>
          <View
            style={[styles.plus, !active && tone === "pink" && styles.plusPink]}
          >
            <Chevron
              color={!active && tone === "pink" ? colors.pink : colors.yellow}
            />
          </View>
        </View>

        <View style={[styles.value, !active && styles.valueEmpty]}>
          <Text
            style={[styles.valueText, !active && styles.valueTextEmpty]}
            numberOfLines={1}
          >
            {currentLabel}
          </Text>
        </View>
      </Pressable>

      {/*
        `animationType="slide"` drags the full-screen backdrop up with the
        sheet, which reads as a wipe. Fade the backdrop and slide only the
        sheet instead.
      */}
      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        {/*
          The backdrop fills the whole screen behind the sheet, and the sheet
          is pinned to the bottom with its height cap on the view that
          actually lays it out. The cap used to sit on an inner view, so the
          wrapper kept the list's full height: the sheet floated mid-screen
          with undimmed strips above and below it.
        */}
        <View style={styles.modalRoot}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={() => setOpen(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(240)}
            style={[
              styles.sheet,
              { maxHeight: height * 0.62, paddingBottom: insets.bottom },
            ]}
          >
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle} allowFontScaling={false}>
                {label}
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Text style={styles.sheetClose} allowFontScaling={false}>
                  DONE
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(o) => o.value || "__all__"}
              style={styles.sheetList}
              contentContainerStyle={styles.sheetListContent}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      track("wt_filter_applied", {
                        filter: label,
                        value: item.value,
                      });
                      onSelect(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selected ? (
                      <Text style={styles.tick} allowFontScaling={false}>
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

/** A drawn chevron centres reliably; a text glyph sits off its own baseline. */
function Chevron({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Shown only while something is actually filtered, so it never sits there as
 * a dead control. Both screens defaulted to a season, which meant the only way
 * back to everything was opening each dropdown and finding "All" in it.
 */
export function ClearFilters({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.clear, pressed && styles.clearPressed]}
    >
      <Svg width={11} height={11} viewBox="0 0 24 24">
        <Path
          d="M6 6L18 18M18 6L6 18"
          stroke={colors.yellow}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.clearText} allowFontScaling={false}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clear: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  clearPressed: { opacity: 0.6 },
  clearText: {
    fontFamily: fonts.black,
    color: colors.yellow,
    fontSize: 11,
    letterSpacing: 1,
  },
  field: {
    flex: 1,
    backgroundColor: "rgba(234, 255, 0, 0.12)",
    borderRadius: radius.sm,
    padding: space.sm,
    gap: space.sm,
  },
  fieldPink: { backgroundColor: "rgba(255, 0, 255, 0.14)" },
  fieldPressed: { opacity: 0.75 },
  fieldHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.xs,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    color: colors.yellow,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  pink: { color: colors.pink },
  plus: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  plusPink: { borderColor: colors.pink },
  value: {
    backgroundColor: colors.yellow,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  valueEmpty: { backgroundColor: "transparent", paddingHorizontal: 0 },
  valueText: {
    fontFamily: fonts.black,
    color: colors.darkpurple,
    fontSize: 14,
  },
  valueTextEmpty: { color: "rgba(255, 255, 255, 0.25)" },

  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(0, 0, 0, 0.6)" },
  sheet: {
    backgroundColor: colors.darkpurple,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: "hidden",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  sheetTitle: { fontFamily: fonts.black, color: colors.yellow, fontSize: 16 },
  sheetClose: { fontFamily: fonts.black, color: colors.pink, fontSize: 14 },
  // Shrinks to fit under the cap and scrolls, rather than pushing past it.
  sheetList: { flexShrink: 1, paddingHorizontal: space.md },
  sheetListContent: { paddingBottom: space.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
  },
  optionSelected: { backgroundColor: colors.rowIdle },
  optionPressed: { backgroundColor: colors.rowActive },
  optionText: { fontFamily: fonts.bold, color: colors.white, fontSize: 16 },
  optionTextSelected: { fontFamily: fonts.black, color: colors.yellow },
  tick: { color: colors.yellow, fontSize: 16, fontFamily: fonts.black },
});
