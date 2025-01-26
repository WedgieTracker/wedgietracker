"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Dialog } from "@radix-ui/react-dialog";

interface TeamSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TeamSearchInput({ value, onChange }: TeamSearchInputProps) {
  const [search, setSearch] = useState(value);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: teams } = api.team.getAll.useQuery();
  const createTeamMutation = api.team.create.useMutation();

  const filteredTeams =
    teams?.filter((team) =>
      team.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleAddNewTeam = async () => {
    try {
      const result = await createTeamMutation.mutateAsync({ name: search });
      onChange(result.name);
      setIsAddingNew(false);
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to create team:", error);
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
        placeholder="Search for a team..."
      />

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-700 bg-darkpurple shadow-lg">
          {filteredTeams.map((team) => (
            <button
              key={team.id}
              type="button"
              className="block w-full px-4 py-2 text-left text-white hover:bg-white/10"
              onClick={(e) => {
                e.preventDefault();
                onChange(team.name);
                setSearch(team.name);
                setShowDropdown(false);
              }}
            >
              {team.name}
            </button>
          ))}
          {search &&
            !filteredTeams.find(
              (t) => t.name.toLowerCase() === search.toLowerCase(),
            ) && (
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-blue-400 hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAddingNew(true);
                }}
              >
                Add new team: {search}
              </button>
            )}
        </div>
      )}

      {isAddingNew && (
        <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-darkpurple p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Add New Team</h2>
            <p className="mb-4 text-white">
              Are you sure you want to add &quot;{search}&quot; as a new team?
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
                  void handleAddNewTeam();
                }}
              >
                Add Team
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
