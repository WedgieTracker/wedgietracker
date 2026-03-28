"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { StandingsFilters } from "./StandingsFilters";
import { StandingsGrid } from "./StandingsGrid";
import { Cta } from "../Cta";
import { useSeasonFallback } from "~/hooks/use-season-fallback";

export function StandingsPage() {
  const {
    global,
    defaultSeason,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: isLoadingSeasonData,
  } = useSeasonFallback();

  const [selectedSeason, setSelectedSeason] = useState(defaultSeason);
  const [includeOpponents, setIncludeOpponents] = useState(true);

  // Update selected season when data loads
  useEffect(() => {
    if (shouldShowPreviousSeason && previousSeason) {
      setSelectedSeason(previousSeason.name);
    } else if (global?.currentSeason?.name) {
      setSelectedSeason(global.currentSeason.name);
    }
  }, [shouldShowPreviousSeason, previousSeason, global?.currentSeason?.name]);

  const { data: standings, isLoading } = api.wedgie.getSeasonStandings.useQuery(
    {
      season: selectedSeason,
      includeOpponents,
    },
    { enabled: true },
  );

  if (isLoading || isLoadingSeasonData) {
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
        <div className="mb-4 rounded-lg border border-pink/30 bg-pink/20 p-4 text-center">
          <p className="text-sm font-bold text-pink">
            Current season has no wedgies yet. Showing {previousSeason?.name}{" "}
            season standings.
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
