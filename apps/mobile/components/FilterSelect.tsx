import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const active = value !== "";
  const current = options.find((o) => o.value === value) ?? options[0];

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
            {current?.label ?? ""}
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
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <Animated.View entering={SlideInDown.duration(240)}>
          <SafeAreaView style={styles.sheet} edges={["bottom"]}>
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
          </SafeAreaView>
        </Animated.View>
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

const styles = StyleSheet.create({
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

  backdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)" },
  sheet: {
    backgroundColor: colors.darkpurple,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "62%",
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
  sheetList: { paddingHorizontal: space.md },
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
