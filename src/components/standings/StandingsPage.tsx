"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { StandingsFilters } from "./StandingsFilters";
import { StandingsGrid } from "./StandingsGrid";
import { Cta } from "../Cta";

export function StandingsPage() {
  const { data: global, isLoading: isLoadingGlobal } =
    api.admin.getGlobal.useQuery();
  const defaultSeason = global?.currentSeason?.name ?? "2024/25";

  const [selectedSeason, setSelectedSeason] = useState(defaultSeason);
  const [includeOpponents, setIncludeOpponents] = useState(true);

  const { data: standings, isLoading } = api.wedgie.getSeasonStandings.useQuery(
    {
      season: selectedSeason,
      includeOpponents,
    },
    { enabled: true },
  );

  if (isLoading || isLoadingGlobal) {
    return (
      <div className="container mx-auto max-w-3xl text-white">
        <StandingsFilters
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          includeOpponents={includeOpponents}
          setIncludeOpponents={setIncludeOpponents}
          isLoading={isLoading}
        />
        <div className="mt-8">
          <StandingsGrid
            players={[]}
            teams={[]}
            isLoading={true}
            currentSeason={selectedSeason}
          />
        </div>
      </div>
    );
  }

  if (!standings) {
    return <div className="text-white">No standings found</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl text-white">
      <StandingsFilters
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
        includeOpponents={includeOpponents}
        setIncludeOpponents={setIncludeOpponents}
        isLoading={isLoading}
      />
      <div className="mt-4 md:mt-8">
        <StandingsGrid
          players={standings?.players ?? []}
          teams={standings?.teams ?? []}
          isLoading={isLoading}
          currentSeason={selectedSeason}
        />
      </div>
      <div className="mt-8 md:mt-16">
        <Cta
          links={[
            { title: "All wedgies", url: "/all-wedgies" },
            { title: "Stats for nerds", url: "/stats-for-nerds" },
            { title: "Seasons history", url: "/seasons-history" },
          ]}
        />
      </div>
    </div>
  );
}
