"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

export function TeamList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: teams, refetch } = api.team.getAll.useQuery();

  const deleteMutation = api.team.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const filteredTeams = teams?.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-cream text-xl font-bold">Teams</h2>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-panel text-cream placeholder:text-cream/50 rounded-md px-3 py-2"
          />
        </div>
        <Link
          href="/admin/teams/new"
          className="border-cream bg-night text-cream hover:bg-cream hover:text-night rounded-md border-2 px-4 py-2 font-bold uppercase transition-colors duration-300"
        >
          Add New Team
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams?.map((team) => (
          <div
            key={team.id}
            className="bg-panel text-cream rounded-lg p-6 shadow-xs"
          >
            <h3 className="text-lg font-semibold">{team.name}</h3>
            <p className="text-cream/70 mt-2 text-sm">
              Home Wedgies: {team.teamGames.length}
            </p>
            <p className="text-cream/70 mt-1 text-sm">
              Away Wedgies: {team.teamAgainstGames.length}
            </p>
            <div className="mt-4 flex space-x-4">
              <Link
                href={`/admin/teams/${team.id}`}
                className="border-cream bg-cream hover:bg-cream/80 text-night rounded-md border-2 px-4 py-1 font-bold uppercase transition-colors duration-300"
              >
                Edit
              </Link>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this team?")) {
                    void deleteMutation.mutateAsync({
                      id: team.id.toString(),
                    });
                  }
                }}
                className="text-cream rounded-md border-2 border-[#FF6FD8] bg-[#FF6FD8] px-4 py-1 font-bold uppercase transition-colors duration-300 hover:bg-[#FF6FD8]/80"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
