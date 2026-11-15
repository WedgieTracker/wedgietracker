"use client";

import { useState, useEffect, useRef } from "react";
import { seasonFromParam } from "@wedgietracker/core/utils/allWedgiesUrl";
import { api } from "~/trpc/react";
import { StandingsFilters } from "./StandingsFilters";
import { StandingsGrid } from "./StandingsGrid";
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
  // Lifted from PlayersTeams so the opponents switch can follow the tab.
  const [tab, setTab] = useState<"players" | "teams">("players");
  // A season in the address (?season=2025-26, or "all") wins over the default.
  const fromUrl = useRef(false);
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("season");
    if (param) {
      fromUrl.current = true;
      setSelectedSeason(param === "all" ? "" : seasonFromParam(param));
    }
  }, []);

  // Update selected season when data loads
  useEffect(() => {
    if (fromUrl.current) return;
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
      <div className="container mx-auto max-w-5xl text-white">
        <StandingsFilters
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          includeOpponents={includeOpponents}
          setIncludeOpponents={setIncludeOpponents}
          isLoading={isLoading}
          teamsShown={tab === "teams"}
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
    <div className="container mx-auto max-w-5xl text-white">
      {shouldShowPreviousSeason && (
        <div className="border-violet/30 bg-violet/20 mb-4 rounded-lg border p-4 text-center">
          <p className="text-violet text-sm font-bold">
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
        teamsShown={tab === "teams"}
      />
      <div className="mt-4 md:mt-8">
        <StandingsGrid
          players={standings?.players ?? []}
          teams={standings?.teams ?? []}
          isLoading={isLoading}
          currentSeason={selectedSeason}
          tab={tab}
          onTabChange={setTab}
        />
      </div>
    </div>
  );
}
