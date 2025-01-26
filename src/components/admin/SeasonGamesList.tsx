"use client";

import { api } from "~/trpc/react";
import { useState } from "react";

export function SeasonGamesList() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const utils = api.useContext();

  const { data: seasonsWithGames, isLoading } =
    api.season.getAllWithGameCount.useQuery(undefined, {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    });

  const removeGamesMutation = api.game.removeOldGames.useMutation({
    onSuccess: async (result) => {
      alert(`${result.message}`);
      await utils.season.getAllWithGameCount.invalidate();
    },
    onError: (error) => {
      alert("Error removing games: " + error.message);
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const updateSeasonsMutation = api.game.updateFutureSeasons.useMutation({
    onSuccess: async (result) => {
      alert(`${result.message}`);
      await utils.season.getAllWithGameCount.invalidate();
    },
    onError: (error) => {
      alert("Error updating seasons: " + error.message);
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const handleRemoveOldGames = async () => {
    if (
      window.confirm(
        "Are you sure you want to remove all games before October 2024? This action cannot be undone.",
      )
    ) {
      setIsDeleting(true);
      removeGamesMutation.mutate();
    }
  };

  const handleUpdateFutureSeasons = async () => {
    if (
      window.confirm(
        "Are you sure you want to update all games after October 2024 to season 2024/25?",
      )
    ) {
      setIsUpdating(true);
      updateSeasonsMutation.mutate();
    }
  };

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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Games per Season</h2>
        <div className="space-x-4">
          <button
            onClick={handleUpdateFutureSeasons}
            disabled={isUpdating}
            className="rounded-md bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600 disabled:opacity-50"
          >
            {isUpdating ? "Updating..." : "Update Future Seasons"}
          </button>
          <button
            onClick={handleRemoveOldGames}
            disabled={isDeleting}
            className="rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? "Removing..." : "Remove Old Games"}
          </button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seasonsWithGames.map((season) => (
          <div
            key={season.id}
            className="rounded-lg bg-white/10 p-6 text-white shadow-sm"
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
