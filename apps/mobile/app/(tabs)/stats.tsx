import { RefreshControl } from "react-native";

import { Screen, SectionLabel } from "@/components/Screen";
import { ErrorState, Loading } from "@/components/States";
import { StatGrid, StatTile } from "@/components/StatTile";
import { api } from "@/lib/api";

export default function StatsScreen() {
  const stats = api.wedgie.getStats.useQuery();

  const refreshing = stats.isRefetching;

  return (
    <Screen
      title="STATS"
      subtitle="Season totals and pace"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void stats.refetch()}
          tintColor="#EAFF00"
        />
      }
    >
      {stats.isPending ? <Loading label="Loading stats" /> : null}
      {stats.error ? <ErrorState message={stats.error.message} /> : null}

      {stats.data ? (
        <>
          <StatGrid>
            <StatTile
              label="Total wedgies"
              value={stats.data.totalWedgies}
              wide
            />
            <StatTile label="Games played" value={stats.data.gamesPlayed} />
            <StatTile
              label="This season"
              value={stats.data.currentSeasonWedgies}
              accent="pink"
            />
          </StatGrid>

          <SectionLabel>Pace</SectionLabel>
          <StatGrid>
            <StatTile
              label="Current pace"
              value={formatPace(stats.data.currentPace)}
            />
            <StatTile
              label="Simple pace"
              value={formatPace(stats.data.simplePace)}
              accent="white"
            />
            <StatTile
              label="Math pace"
              value={formatPace(stats.data.mathPace)}
              accent="white"
            />
            <StatTile
              label="Previous record"
              value={stats.data.previousRecord}
              accent="pink"
            />
          </StatGrid>

          <SectionLabel>Live</SectionLabel>
          <StatGrid>
            <StatTile
              label="Games on now"
              value={stats.data.liveGames ? "Yes" : "No"}
              accent={stats.data.liveGames ? "yellow" : "white"}
              wide
            />
          </StatGrid>
        </>
      ) : null}
    </Screen>
  );
}

function formatPace(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "-";
}
