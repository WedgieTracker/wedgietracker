export const dynamic = "force-static";
export const revalidate = 300;

import { Suspense } from "react";
import { api } from "~/trpc/server";
import { PageLayout } from "~/components/layout/PageLayout";
import { StatsForNerds } from "~/components/stats-for-nerds/StatsForNerds";
import { Loader } from "~/components/loader";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Stats for Nerds",
  description:
    "Stats for nerds, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function StatsForNerdsPage() {
  return (
    <PageLayout>
      <div className="w-full">
        <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
          <h1 className="text-center text-6xl font-black uppercase leading-none md:text-7xl">
            <span className="text-shadow-darkpurple relative z-10 block leading-none text-yellow">
              Stats
            </span>
            <span className="relative z-0 mt-[-.4em] block text-[.6em] leading-none text-pink">
              For Nerds
            </span>
          </h1>

          <Suspense fallback={<LoaderWrapper />}>
            <StatsWrapper />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex h-full min-h-[100svh] w-full justify-center">
      <div className="items-top mr-[-30px] flex h-full w-full max-w-[150px] justify-center">
        <Loader />
      </div>
    </div>
  );
};

async function StatsWrapper() {
  const stats = await api.wedgie.getNerdStats();
  return <StatsForNerds stats={stats} />;
}
