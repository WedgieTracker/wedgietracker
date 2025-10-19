"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { StandingsFilters } from "./StandingsFilters";
import { StandingsGrid } from "./StandingsGrid";
import { Cta } from "../Cta";

export function StandingsPage() {
  const { data: global, isLoading: isLoadingGlobal } =
    api.admin.getGlobal.useQuery();
  const { data: seasons, isLoading: isLoadingSeasons } = api.season.getAllWithStats.useQuery();
  const { data: stats, isLoading: isLoadingStats } = api.wedgie.getStats.useQuery();
  
  const defaultSeason = global?.currentSeason?.name ?? "2025/26";
  
  // Find previous season when current season has 0 wedgies
  const getPreviousSeason = () => {
    if (!seasons || !global?.currentSeason?.name) return null;
    
    const currentSeasonIndex = seasons.findIndex(s => s.name === global.currentSeason.name);
    
    // If current season is at index 0, there's no previous season
    // In this case, we should show the most recent season with wedgies
    if (currentSeasonIndex === 0) {
      const seasonWithWedgies = seasons.find(season => season.totalWedgies > 0);
      return seasonWithWedgies ?? null;
    }
    
    const previousSeason = seasons[currentSeasonIndex - 1];
    return previousSeason;
  };
  
  const previousSeason = getPreviousSeason();
  const shouldShowPreviousSeason = stats?.currentSeasonWedgies === 0 && previousSeason;
  
  const [selectedSeason, setSelectedSeason] = useState(defaultSeason);
  const [includeOpponents, setIncludeOpponents] = useState(true);
  

  // Update selected season when data loads
  useEffect(() => {
    if (shouldShowPreviousSeason && previousSeason) {
      setSelectedSeason(previousSeason.name);
    } else if (global?.currentSeason?.name) {
      setSelectedSeason(global.currentSeason.name);
    }
  }, [shouldShowPreviousSeason, previousSeason, global?.currentSeason?.name, stats?.currentSeasonWedgies]);

  const { data: standings, isLoading } = api.wedgie.getSeasonStandings.useQuery(
    {
      season: selectedSeason,
      includeOpponents,
    },
    { enabled: true },
  );

  if (isLoading || isLoadingGlobal || isLoadingSeasons || isLoadingStats) {
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
      {shouldShowPreviousSeason && (
        <div className="mb-4 rounded-lg bg-pink/20 border border-pink/30 p-4 text-center">
          <p className="text-sm font-bold text-pink">
            Current season has no wedgies yet. Showing {previousSeason.name} season standings.
          </p>
        </div>
      )}
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
