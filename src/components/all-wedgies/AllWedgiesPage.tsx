"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { WedgieFilters } from "./WedgieFilters";
import { WedgieGrid } from "./WedgieGrid";
import { WedgieModal } from "~/components/home/WedgieModal";
import type { WedgieWithTypes } from "~/types/wedgie";
import { Cta } from "~/components/Cta";

export function AllWedgiesPage() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWedgieData, setSelectedWedgieData] =
    useState<WedgieWithTypes | null>(null);

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
  const initialSeason = shouldShowPreviousSeason ? previousSeason.name : defaultSeason;

  // Initialize filters with URL params
  const wsParam = searchParams.get("ws");
  const hasSeasonFromUrl = wsParam !== null;
  const isAllSeasons = wsParam === "all";
  const [filters, setFilters] = useState({
    season: isAllSeasons ? "" : (wsParam ?? initialSeason),
    type: "",
    playerOrTeam: searchParams.get("wp") ?? searchParams.get("wt") ?? "",
  });

  // Queries first
  const { data: allWedgies, isLoading: isLoadingAll } =
    api.wedgie.getAll.useQuery();
  const { data: seasonWedgies, isLoading: isLoadingSeason } =
    api.wedgie.getBySeason.useQuery(
      { season: filters.season },
      { enabled: !!filters.season },
    );

  // Use the appropriate data source
  const wedgies = filters.season ? seasonWedgies : allWedgies;

  useEffect(() => {
    const wedgieNumber = searchParams.get("wn");
    const season = searchParams.get("ws");

    if (wedgieNumber && wedgies) {
      const wedgie = wedgies.find(
        (w) => w.seasonName === season && w.number?.toString() === wedgieNumber,
      );

      if (wedgie) {
        setSelectedWedgieData(wedgie);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, wedgies, defaultSeason]);

  // Update selected season when data loads (but not if URL explicitly specified a season)
  useEffect(() => {
    if (hasSeasonFromUrl) return;

    if (shouldShowPreviousSeason && previousSeason) {
      setFilters(prev => ({
        ...prev,
        season: previousSeason.name
      }));
    } else if (global?.currentSeason?.name) {
      setFilters(prev => ({
        ...prev,
        season: global.currentSeason.name
      }));
    }
  }, [shouldShowPreviousSeason, previousSeason, global?.currentSeason?.name, stats?.currentSeasonWedgies, hasSeasonFromUrl]);

  useEffect(() => {
    if (hasSeasonFromUrl) return;

    setFilters({
      ...filters,
      season: defaultSeason,
    });
  }, [global, hasSeasonFromUrl]);

  // Only show loading state while data is loading
  if (isLoadingAll || isLoadingSeason || isLoadingGlobal || isLoadingSeasons || isLoadingStats) {
    return (
      <div className="container mx-auto max-w-7xl text-white">
        <WedgieFilters
          filters={filters}
          setFilters={setFilters}
          visibleWedgies={0}
        />
        <div className="mt-8">
          <WedgieGrid wedgies={[]} isLoading={true} />
        </div>
      </div>
    );
  }

  // Show no wedgies message only after loading is complete and there's no data
  if (!wedgies) {
    return <div className="text-white">No wedgies found</div>;
  }

  // Apply remaining filters
  const filteredWedgies = wedgies.filter((wedgie) => {
    const matchesType =
      !filters.type ||
      wedgie.types?.some(
        (t) => t.name.toLowerCase() === filters.type.toLowerCase(),
      );
    const matchesPlayerOrTeam =
      !filters.playerOrTeam ||
      wedgie.playerName
        ?.toLowerCase()
        .includes(filters.playerOrTeam.toLowerCase()) ||
      wedgie.teamName
        ?.toLowerCase()
        .includes(filters.playerOrTeam.toLowerCase()) ||
      wedgie.teamAgainstName
        ?.toLowerCase()
        .includes(filters.playerOrTeam.toLowerCase());

    return matchesType && matchesPlayerOrTeam;
  });

  return (
    <div className="container mx-auto max-w-7xl text-white">
      {shouldShowPreviousSeason && (
        <div className="mb-4 rounded-lg bg-pink/20 border border-pink/30 p-4 text-center">
          <p className="text-sm font-bold text-pink">
            Current season has no wedgies yet. Showing {previousSeason.name} season wedgies.
          </p>
        </div>
      )}
      <WedgieFilters
        filters={filters}
        setFilters={setFilters}
        visibleWedgies={filteredWedgies.length}
      />
      <div className="mt-8">
        <WedgieGrid
          wedgies={filteredWedgies}
          isLoading={isLoadingAll || isLoadingSeason}
          onWedgieClick={(wedgie) => {
            setSelectedWedgieData(wedgie);
            setIsModalOpen(true);
          }}
        />
      </div>
      {selectedWedgieData && (
        <WedgieModal
          wedgie={selectedWedgieData}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedWedgieData(null);
          }}
          onPrevious={() => {
            const currentIndex =
              wedgies?.findIndex((w) => w.id === selectedWedgieData.id) ?? -1;

            const prevWedgie = wedgies?.[currentIndex - 1];
            if (prevWedgie) {
              setSelectedWedgieData(prevWedgie);
            }
          }}
          onNext={() => {
            const currentIndex =
              wedgies?.findIndex((w) => w.id === selectedWedgieData.id) ?? -1;

            const nextWedgie = wedgies?.[currentIndex + 1];
            if (nextWedgie) {
              setSelectedWedgieData(nextWedgie);
            }
          }}
          hasPrevious={
            !!wedgies &&
            wedgies.findIndex((w) => w.id === selectedWedgieData.id) > 0
          }
          hasNext={
            !!wedgies &&
            wedgies.findIndex((w) => w.id === selectedWedgieData.id) <
              wedgies.length - 1
          }
        />
      )}
      <div className="mt-8 md:mt-16">
        <Cta
          links={[
            { title: "Standings", url: "/standings" },
            { title: "Stats for nerds", url: "/stats-for-nerds" },
            { title: "Seasons history", url: "/seasons-history" },
          ]}
        />
      </div>
    </div>
  );
}
