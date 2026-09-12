import { RefreshControl, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Empty, ErrorState, Loading } from "@/components/States";
import { WedgieCard } from "@/components/WedgieCard";
import { api } from "@/lib/api";

export default function FeedScreen() {
  const latest = api.wedgie.getLatestWedgies.useQuery();

  return (
    <Screen
      title="Latest wedgies"
      subtitle="The most recent hoop-jams, freshest first"
      refreshControl={
        <RefreshControl
          refreshing={latest.isRefetching}
          onRefresh={() => void latest.refetch()}
          tintColor="#EAFF00"
        />
      }
    >
      {latest.isPending ? <Loading label="Loading wedgies" /> : null}

      {latest.error ? <ErrorState message={latest.error.message} /> : null}

      {latest.data?.length === 0 ? <Empty label="No wedgies yet." /> : null}

      <View>
        {latest.data?.map((wedgie) => (
          <WedgieCard key={wedgie.id} wedgie={wedgie} />
        ))}
      </View>
    </Screen>
  );
}
