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
      <div className="text-center text-white">
        <p>Loading seasons data...</p>
      </div>
    );
  }

  if (!seasonsWithGames) {
    return (
      <div className="text-center text-white">
        <p>No seasons data available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Games per Season</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seasonsWithGames.map((season) => (
          <div
            key={season.id}
            className="rounded-lg bg-white/10 p-6 text-white shadow-xs"
          >
            <h3 className="text-lg font-semibold">{season.name}</h3>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-300">
                Total Games: {season._count.games}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
