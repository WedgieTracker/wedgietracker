import { api } from "~/trpc/server";
import { Stats } from "~/components/home/Stats";
import { StatsSkeleton } from "~/components/home/StatsSkeleton";
import { WedgieList } from "~/components/home/WedgieList";
import { Standings } from "~/components/home/Standings";
import { PageLayout } from "~/components/layout/PageLayout";
import { EasterEgg } from "~/components/home/EasterEgg";
import type { WedgieWithTypes } from "~/types/wedgie";
import { Suspense } from "react";
import { Loader } from "~/components/shared/Loader";
import Link from "next/link";
import { Newsletter } from "~/components/home/Newsletter";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "NBA Wedgie Tracker | Count, pace and history",
  description:
    "NBA original WedgieTracker. We count how many times a basketball gets stuck between the backboard and the rim. NoDunks Inspired.",
});

export default async function Home() {
  return (
    <PageLayout showCircleMenu={false}>
      <div className="flex flex-col md:flex-row">
        <Suspense fallback={<StatsSkeleton />}>
          <StatsWrapper />
        </Suspense>
        <div className="bg-darkpurple-dark flex w-full flex-col items-center justify-center gap-12 px-4 py-8 md:w-3/5 md:px-8 md:py-8 lg:w-1/2">
          <Suspense fallback={<LoaderWrapper />}>
            <WedgieListWrapper />

            <StandingsWrapper />

            <TotalWedgiesWrapper />

            <EasterEgg />
            {/* Newsletter */}
            <Newsletter />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="mr-[-20px] flex h-full min-h-[90svh] w-full max-w-[150px] items-center justify-center">
      <Loader />
    </div>
  );
};

// Create wrapper components for data fetching
async function StatsWrapper() {
  const stats = await api.wedgie.getStats();
  return <Stats stats={stats} />;
}

async function WedgieListWrapper() {
  const wedgies = (await api.wedgie.getLatestWedgies()) as WedgieWithTypes[];
  return <WedgieList wedgies={wedgies} />;
}

async function StandingsWrapper() {
  const standings = await api.wedgie.getTopStandings();
  const stats = await api.wedgie.getStats();

  // Hide standings content when there are 0 wedgies this season
  if (stats.currentSeasonWedgies === 0) {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center justify-center">
        <Link
          href="/standings"
          className="border-yellow bg-yellow text-button-text text-darkpurple hover:border-yellow hover:text-yellow w-full rounded-3xl border-2 py-2 text-center font-black transition-all duration-300 hover:bg-transparent"
        >
          SEE STANDINGS
        </Link>
      </div>
    );
  }

  return <Standings players={standings.players} teams={standings.teams} />;
}

async function TotalWedgiesWrapper() {
  const total = await api.wedgie.getTotalWedgies();
  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-between gap-4">
      <div className="sm:text-wedgies-text flex flex-row items-center gap-4 text-3xl leading-none">
        <span className="text-yellow text-[1.5em] font-black">{total}</span>
        <div className="gap-.5 flex flex-col">
          <span className="text-pink text-[0.6em] leading-none font-black uppercase">
            Total Wedgies
          </span>
          <span className="mt-[0.2em] text-[0.4em] leading-none font-bold text-white/50 uppercase">
            From the 2014/15 season
          </span>
        </div>
      </div>
      <Link
        href="/seasons-history"
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow block rounded-full border-2 px-6 py-1 font-black uppercase transition-all duration-300"
      >
        Seasons History
      </Link>
    </div>
  );
}
