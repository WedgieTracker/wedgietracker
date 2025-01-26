"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Dialog } from "@radix-ui/react-dialog";

interface PlayerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PlayerSearchInput({ value, onChange }: PlayerSearchInputProps) {
  const [search, setSearch] = useState(value);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: players } = api.player.getAll.useQuery();
  const createPlayerMutation = api.player.create.useMutation();

  const filteredPlayers =
    players?.filter((player) =>
      player.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleAddNewPlayer = async () => {
    try {
      const result = await createPlayerMutation.mutateAsync({ name: search });
      onChange(result.name);
      setIsAddingNew(false);
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to create player:", error);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
        placeholder="Search for a player..."
      />

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-700 bg-darkpurple shadow-lg">
          {filteredPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              className="block w-full px-4 py-2 text-left text-white hover:bg-white/10"
              onClick={(e) => {
                e.preventDefault();
                onChange(player.name);
                setSearch(player.name);
                setShowDropdown(false);
              }}
            >
              {player.name}
            </button>
          ))}
          {search &&
            !filteredPlayers.find(
              (p) => p.name.toLowerCase() === search.toLowerCase(),
            ) && (
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-blue-400 hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAddingNew(true);
                }}
              >
                Add new player: {search}
              </button>
            )}
        </div>
      )}

      {isAddingNew && (
        <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-darkpurple p-6">
            <h2 className="mb-4 text-lg font-bold text-white">
              Add New Player
            </h2>
            <p className="mb-4 text-white">
              Are you sure you want to add &quot;{search}&quot; as a new player?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 text-white hover:text-gray-300"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAddingNew(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleAddNewPlayer();
                }}
              >
                Add Player
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
