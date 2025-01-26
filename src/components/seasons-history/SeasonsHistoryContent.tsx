"use client";

import { api } from "~/trpc/react";
import { SeasonCard } from "./SeasonCard";
import { Loader } from "~/components/loader";
import { Cta } from "../Cta";
export function SeasonsHistoryContent() {
  const { data: seasons, isLoading } = api.season.getAllWithStats.useQuery();

  if (isLoading) return <LoaderWrapper />;

  if (!seasons) return null;

  return (
    <div className="container mx-auto max-w-6xl space-y-4 md:space-y-8">
      {seasons.map((season) => (
        <SeasonCard key={season.name} season={season} />
      ))}
      <div className="mt-16">
        <Cta
          links={[
            { title: "All wedgies", url: "/all-wedgies" },
            { title: "Stats for nerds", url: "/stats-for-nerds" },
            { title: "Standings", url: "/standings" },
          ]}
        />
      </div>
    </div>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex h-full min-h-[100svh] w-full justify-center">
      <div className="items-top mr-[-30px] w-full max-w-[150px] justify-center">
        <Loader />
      </div>
    </div>
  );
};
