import { NativeTabs } from "expo-router/unstable-native-tabs";

import { colors, fonts } from "@/lib/theme";

/**
 * The real UITabBarController rather than a JavaScript tab bar, so on iOS 26
 * the system draws it with Liquid Glass and derives its material from whatever
 * scrolls behind it.
 *
 * That also means the bar's background is not ours to set: `backgroundColor`
 * and `blurEffect` only apply on iOS 18 and earlier. The bar reads dark
 * because every screen behind it is dark, which is the documented way to get
 * a dark bar on 26.
 */
export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={colors.yellow}
      labelStyle={{ fontFamily: fonts.bold, color: colors.white60 }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="all-wedgies">
        <NativeTabs.Trigger.Icon sf="play.rectangle.fill" md="play_circle" />
        <NativeTabs.Trigger.Label>Wedgies</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="standings">
        <NativeTabs.Trigger.Icon sf="list.number" md="format_list_numbered" />
        <NativeTabs.Trigger.Label>Standings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
