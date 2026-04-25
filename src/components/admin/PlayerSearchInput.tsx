"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { AddNewEntityDialog } from "./AddNewEntityDialog";

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
      onChange(result!.name);
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
        <div className="bg-darkpurple absolute z-10 mt-1 w-full rounded-md border border-gray-700 shadow-lg">
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
        <AddNewEntityDialog
          open={isAddingNew}
          onOpenChange={setIsAddingNew}
          entityLabel="Player"
          searchValue={search}
          onConfirm={() => void handleAddNewPlayer()}
        />
      )}
    </div>
  );
}
