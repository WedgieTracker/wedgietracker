"use client";

import { isGemsDate } from "@wedgietracker/core/utils/formatDate";
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
          <h2 className="text-cream text-xl font-bold">Wedgies</h2>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-panel text-cream rounded-md px-3 py-2"
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
          className="border-cream bg-night text-cream hover:bg-cream hover:text-night rounded-md border-2 px-4 py-2 font-bold uppercase transition-colors duration-300"
        >
          Add New Wedgie
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wedgies?.map((wedgie) => (
          <div
            key={wedgie.id}
            className="bg-panel text-cream rounded-lg p-6 shadow-xs"
          >
            <h3 className="text-lg font-semibold">
              #{wedgie.number} - {wedgie.playerName}
            </h3>
            <p suppressHydrationWarning className="text-cream/70 mt-1 text-sm">
              {wedgie.teamName} - {wedgie.teamAgainstName} |{" "}
              {isGemsDate(new Date(wedgie.wedgieDate))
                ? "GEM, no date"
                : new Date(wedgie.wedgieDate).toLocaleDateString()}
            </p>
            <div className="mt-3 flex space-x-4">
              <Link
                href={`/admin/wedgies/${wedgie.id}`}
                className="bg-cream hover:bg-cream/80 text-night rounded-md px-4 py-1 font-bold uppercase"
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
                className="text-cream rounded-md bg-[#FF6FD8] px-4 py-1 font-bold uppercase hover:bg-[#FF6FD8]/80"
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
