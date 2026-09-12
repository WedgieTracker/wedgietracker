import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";

import { colors } from "@/lib/theme";

function TabIcon({ name, color }: { name: string; color: ColorValue }) {
  return (
    <SymbolView
      name={name as never}
      tintColor={color}
      size={24}
      resizeMode="scaleAspectFit"
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.darkpurpleDark,
          borderTopColor: colors.hairline,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabIcon name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="all-wedgies"
        options={{
          title: "Wedgies",
          tabBarIcon: ({ color }) => (
            <TabIcon name="play.rectangle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: "Standings",
          tabBarIcon: ({ color }) => (
            <TabIcon name="list.number" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <TabIcon name="chart.bar.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
