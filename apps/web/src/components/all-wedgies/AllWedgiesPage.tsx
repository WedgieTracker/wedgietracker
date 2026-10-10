"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { WedgieFilters } from "./WedgieFilters";
import { WedgieGrid } from "./WedgieGrid";
import { WedgieModal } from "~/components/home/WedgieModal";
import type { WedgieWithTypes } from "@wedgietracker/core/types/wedgie";
import { Cta } from "~/components/shared/Cta";
import { api } from "~/trpc/react";
import { useSeasonFallback } from "~/hooks/use-season-fallback";
import { matchesFilter } from "@wedgietracker/core/utils/wedgieFilter";
import {
  buildAllWedgiesQuery,
  parseAllWedgiesQuery,
} from "@wedgietracker/core/utils/allWedgiesUrl";

export function AllWedgiesPage() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWedgieData, setSelectedWedgieData] =
    useState<WedgieWithTypes | null>(null);

  const {
    global,
    stats,
    defaultSeason,
    previousSeason,
    shouldShowPreviousSeason,
    isLoading: isLoadingSeasonData,
  } = useSeasonFallback();

  const initialSeason = shouldShowPreviousSeason
    ? previousSeason!.name
    : defaultSeason;

  // What the page was opened with. Read once: afterwards the URL follows the
  // filters, not the other way round.
  const [fromUrl] = useState(() =>
    parseAllWedgiesQuery(searchParams ?? new URLSearchParams()),
  );
  const hasSeasonFromUrl = fromUrl.season !== undefined;
  const [filters, setFilters] = useState({
    season: fromUrl.season ?? initialSeason,
    type: fromUrl.type ?? "",
    playerOrTeam: fromUrl.playerOrTeam ?? "",
    moment: fromUrl.moment ?? "",
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

  // Slugs in the URL ("three-point", "luka-doncic") become the names the
  // filters use once the full list is here to match them against.
  const resolvedNames = useRef(false);
  useEffect(() => {
    if (!allWedgies || resolvedNames.current) return;
    resolvedNames.current = true;
    const named = parseAllWedgiesQuery(searchParams ?? new URLSearchParams(), {
      types: [
        ...new Set(allWedgies.flatMap((w) => w.types.map((t) => t.name))),
      ],
      players: [...new Set(allWedgies.map((w) => w.playerName))],
    });
    setFilters((prev) => ({
      ...prev,
      type: named.type ?? prev.type,
      playerOrTeam: named.playerOrTeam ?? prev.playerOrTeam,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWedgies]);

  // Open the wedgie the link points at, once.
  const openedFromUrl = useRef(false);
  useEffect(() => {
    if (openedFromUrl.current || !fromUrl.wedgie || !wedgies) return;
    // An empty season ("all") means the number alone picks the wedgie.
    const season = fromUrl.season ?? filters.season;
    const wedgie = wedgies.find(
      (w) =>
        w.number === fromUrl.wedgie && (!season || w.seasonName === season),
    );
    if (wedgie) {
      openedFromUrl.current = true;
      setSelectedWedgieData(wedgie);
      setIsModalOpen(true);
    }
  }, [wedgies, fromUrl, filters.season]);

  // Keep the address bar in step with the filters and the open wedgie, so
  // any view can be copied from it.
  useEffect(() => {
    if (isLoadingSeasonData) return;
    const open = isModalOpen && selectedWedgieData;
    const query = buildAllWedgiesQuery({
      season: open ? selectedWedgieData.seasonName : filters.season,
      wedgie: open ? selectedWedgieData.number : null,
      playerOrTeam: filters.playerOrTeam,
      type: filters.type,
      moment: filters.moment,
    });
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url);
    }
  }, [filters, isModalOpen, selectedWedgieData, isLoadingSeasonData]);

  // Update selected season when data loads (but not if URL explicitly specified a season)
  useEffect(() => {
    if (hasSeasonFromUrl) return;

    if (shouldShowPreviousSeason && previousSeason) {
      setFilters((prev) => ({
        ...prev,
        season: previousSeason.name,
      }));
    } else if (global?.currentSeason?.name) {
      setFilters((prev) => ({
        ...prev,
        season: global.currentSeason.name,
      }));
    }
  }, [
    shouldShowPreviousSeason,
    previousSeason,
    global?.currentSeason?.name,
    stats?.currentSeasonWedgies,
    hasSeasonFromUrl,
  ]);

  // Only show loading state while data is loading
  if (isLoadingAll || isLoadingSeason || isLoadingSeasonData) {
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
    return matchesFilter(wedgie, filters);
  });

  return (
    <div className="container mx-auto max-w-7xl text-white">
      {shouldShowPreviousSeason && (
        <div className="border-pink/30 bg-pink/20 mb-4 rounded-lg border p-4 text-center">
          <p className="text-pink text-sm font-bold">
            Current season has no wedgies yet. Showing {previousSeason?.name}{" "}
            season wedgies.
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
