"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

import Link from "next/link";

interface WedgieListProps {
  seasons: { name: string }[];
  currentSeason: string | null;
}

export function WedgieList({ seasons, currentSeason }: WedgieListProps) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);

  const { data: wedgies, refetch } = api.wedgie.getBySeason.useQuery(
    { season: selectedSeason ?? "" },
    { enabled: !!selectedSeason },
  );

  const deleteMutation = api.wedgie.delete.useMutation({
    onSuccess: () => refetch(),
  });

  if (!selectedSeason) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">Wedgies</h2>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="rounded-md bg-white/10 px-3 py-2 text-white"
          >
            {seasons.map((season) => (
              <option key={season.name} value={season.name}>
                {season.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/admin/wedgies/new"
          className="rounded-md border-2 border-yellow bg-darkpurple px-4 py-2 font-bold uppercase text-yellow transition-colors duration-300 hover:bg-yellow hover:text-black"
        >
          Add New Wedgie
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wedgies?.map((wedgie) => (
          <div
            key={wedgie.id}
            className="rounded-lg bg-white/10 p-6 text-white shadow-sm"
          >
            <h3 className="text-lg font-semibold">
              #{wedgie.number} - {wedgie.playerName}
            </h3>
            <p className="mt-1 text-sm text-gray-300">
              {wedgie.teamName} - {wedgie.teamAgainstName} |{" "}
              {wedgie.wedgieDate.toLocaleDateString()}
            </p>
            <div className="mt-3 flex space-x-4">
              <Link
                href={`/admin/wedgies/${wedgie.id}`}
                className="rounded-md bg-yellow px-4 py-1 font-bold uppercase text-black hover:bg-yellow/80"
              >
                Edit
              </Link>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this wedgie?")) {
                    void deleteMutation.mutateAsync({
                      id: wedgie.id.toString(),
                    });
                  }
                }}
                className="rounded-md bg-red-500 px-4 py-1 font-bold uppercase text-white hover:bg-red-600"
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
