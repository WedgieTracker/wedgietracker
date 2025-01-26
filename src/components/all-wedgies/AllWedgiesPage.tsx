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
  console.log("global", global);
  const defaultSeason = global?.currentSeason?.name ?? "2024/25";
  console.log("defaultSeason", defaultSeason);

  // Initialize filters with URL params
  const [filters, setFilters] = useState({
    season: searchParams.get("ws") ?? defaultSeason,
    type: "",
    playerOrTeam: searchParams.get("wp") ?? searchParams.get("wt") ?? "",
  });

  console.log("filters", filters);

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

  useEffect(() => {
    setFilters({
      ...filters,
      season: defaultSeason,
    });
  }, [global]);

  // Only show loading state while data is loading
  if (isLoadingAll || isLoadingSeason || isLoadingGlobal) {
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
            console.log("Previous clicked");
            const currentIndex =
              wedgies?.findIndex((w) => w.id === selectedWedgieData.id) ?? -1;
            console.log("Current index:", currentIndex);
            const prevWedgie = wedgies?.[currentIndex - 1];
            if (prevWedgie) {
              setSelectedWedgieData(prevWedgie);
            }
          }}
          onNext={() => {
            console.log("Next clicked");
            const currentIndex =
              wedgies?.findIndex((w) => w.id === selectedWedgieData.id) ?? -1;
            console.log("Current index:", currentIndex);
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
