import { useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { ErrorState, Loading } from "@/components/States";
import { WedgieRow } from "@/components/WedgieRow";
import { api } from "@/lib/api";
import { colors, fonts, space } from "@/lib/theme";

/**
 * The mobile equivalent of apps/web/src/app/all-wedgies - every wedgie, newest
 * first. Reached from WATCH THEM ALL on the home screen.
 */
export default function AllWedgiesScreen() {
  const router = useRouter();
  const all = api.wedgie.getAll.useQuery();

  const wedgies = useMemo(() => {
    if (!all.data) return [];
    return [...all.data].sort(
      (a, b) =>
        new Date(b.wedgieDate).getTime() - new Date(a.wedgieDate).getTime(),
    );
  }, [all.data]);

  if (all.isPending) return <Loading label="Loading wedgies" />;

  if (all.error) {
    return (
      <View style={styles.padded}>
        <ErrorState message={all.error.message} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={wedgies}
      keyExtractor={(w) => String(w.id)}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={all.isRefetching}
          onRefresh={() => void all.refetch()}
          tintColor={colors.yellow}
        />
      }
      ListHeaderComponent={
        <Text style={styles.count} allowFontScaling={false}>
          {wedgies.length} WEDGIES
        </Text>
      }
      renderItem={({ item, index }) => (
        <WedgieRow
          wedgie={item}
          first={index === 0}
          last={index === wedgies.length - 1}
          onPress={() => router.push(`/wedgie/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkpurpleDark },
  content: { padding: space.lg, paddingBottom: space.xxl },
  padded: {
    flex: 1,
    padding: space.lg,
    backgroundColor: colors.darkpurpleDark,
  },
  count: {
    fontFamily: fonts.black,
    color: colors.pink,
    fontSize: 13,
    letterSpacing: 1.4,
    marginBottom: space.md,
  },
});
