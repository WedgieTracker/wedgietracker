"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

export function PlayerList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: players, refetch } = api.player.getAll.useQuery();

  const deleteMutation = api.player.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const filteredPlayers = players?.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">Players</h2>
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md bg-white/10 px-3 py-2 text-white placeholder:text-white/50"
          />
        </div>
        <Link
          href="/admin/players/new"
          className="rounded-md border-2 border-yellow bg-darkpurple px-4 py-2 font-bold uppercase text-yellow transition-colors duration-300 hover:bg-yellow hover:text-black"
        >
          Add New Player
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers?.map((player) => (
          <div
            key={player.id}
            className="rounded-lg bg-white/10 p-6 text-white shadow-sm"
          >
            <h3 className="text-lg font-semibold">{player.name}</h3>
            <p className="mt-2 text-sm text-gray-300">
              Total Wedgies: {player.wedgies.length}
            </p>
            <div className="mt-4 flex space-x-4">
              <Link
                href={`/admin/players/${player.id}`}
                className="rounded-md border-2 border-yellow bg-yellow px-4 py-1 font-bold uppercase text-black transition-colors duration-300 hover:bg-yellow/80"
              >
                Edit
              </Link>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this player?")) {
                    void deleteMutation.mutateAsync({
                      id: player.id.toString(),
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
