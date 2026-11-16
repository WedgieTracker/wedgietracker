"use client";

import { api } from "~/trpc/react";

export function SeasonGamesList() {
  const { data: seasonsWithGames, isLoading } =
    api.season.getAllWithGameCount.useQuery(undefined, {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    });

  if (isLoading) {
    return (
      <div className="text-cream text-center">
        <p>Loading seasons data...</p>
      </div>
    );
  }

  if (!seasonsWithGames) {
    return (
      <div className="text-cream text-center">
        <p>No seasons data available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-cream text-2xl font-bold">Games per Season</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seasonsWithGames.map((season) => (
          <div
            key={season.id}
            className="bg-panel text-cream rounded-lg p-6 shadow-xs"
          >
            <h3 className="text-lg font-semibold">{season.name}</h3>
            <div className="mt-4 space-y-2">
              <p className="text-cream/70 text-sm">
                Total Games: {season._count.games}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
