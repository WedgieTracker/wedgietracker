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
          <h2 className="text-xl font-bold text-white">Teams</h2>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md bg-white/10 px-3 py-2 text-white placeholder:text-white/50"
          />
        </div>
        <Link
          href="/admin/teams/new"
          className="rounded-md border-2 border-yellow bg-darkpurple px-4 py-2 font-bold uppercase text-yellow transition-colors duration-300 hover:bg-yellow hover:text-black"
        >
          Add New Team
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams?.map((team) => (
          <div
            key={team.id}
            className="rounded-lg bg-white/10 p-6 text-white shadow-sm"
          >
            <h3 className="text-lg font-semibold">{team.name}</h3>
            <p className="mt-2 text-sm text-gray-300">
              Home Wedgies: {team.teamGames.length}
            </p>
            <p className="mt-1 text-sm text-gray-300">
              Away Wedgies: {team.teamAgainstGames.length}
            </p>
            <div className="mt-4 flex space-x-4">
              <Link
                href={`/admin/teams/${team.id}`}
                className="rounded-md border-2 border-yellow bg-yellow px-4 py-1 font-bold uppercase text-black transition-colors duration-300 hover:bg-yellow/80"
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
                className="rounded-md border-2 border-red-500 bg-red-500 px-4 py-1 font-bold uppercase text-white transition-colors duration-300 hover:bg-red-600"
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
