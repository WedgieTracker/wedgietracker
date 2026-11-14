"use client";

import { api } from "~/trpc/react";
import { SeasonCard } from "./SeasonCard";
import { Loader } from "~/components/shared/Loader";
export function SeasonsHistoryContent() {
  const { data: seasons, isLoading } = api.season.getAllWithStats.useQuery();

  if (isLoading) return <LoaderWrapper />;

  if (!seasons) return null;

  // Filter out seasons with 0 wedgies
  const seasonsWithWedgies = seasons.filter(
    (season) => season.totalWedgies > 0,
  );

  return (
    <div className="container mx-auto max-w-6xl space-y-4 md:space-y-8">
      {seasonsWithWedgies.map((season) => (
        <SeasonCard key={season.name} season={season} />
      ))}
    </div>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex h-full min-h-svh w-full justify-center">
      <div className="items-top mr-[-30px] w-full max-w-[150px] justify-center">
        <Loader />
      </div>
    </div>
  );
};
