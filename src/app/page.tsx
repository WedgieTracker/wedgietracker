import { api } from "~/trpc/server";
import { Stats } from "~/components/home/Stats";
import { StatsSkeleton } from "~/components/home/StatsSkeleton";
import { WedgieList } from "~/components/home/WedgieList";
import { Standings } from "~/components/home/Standings";
import { Header } from "~/components/layout/Header";
import { MenuProvider } from "~/context/MenuContext";
import { EasterEgg } from "~/components/home/EasterEgg";
import { Footer } from "~/components/layout/Footer";
import type { WedgieWithTypes } from "~/types/wedgie";
import { Suspense } from "react";
import { Loader } from "~/components/loader";
import Link from "next/link";
import { Newsletter } from "~/components/home/Newsletter";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "NBA Wedgie Tracker | Count, pace and history",
  description:
    "NBA original WedgieTracker. We count how many times a basketball gets stuck between the backboard and the rim. NoDunks Inspired.",
});

export default function Home() {
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />

        <div className="flex flex-col md:flex-row">
          <Suspense fallback={<StatsSkeleton />}>
            <StatsWrapper />
          </Suspense>
          <div className="flex w-full flex-col items-center justify-center gap-12 bg-darkpurple-dark px-4 py-8 md:w-3/5 md:px-8 md:py-8 lg:w-1/2">
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
      </div>
      <Footer />
    </MenuProvider>
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
  return <Standings players={standings.players} teams={standings.teams} />;
}

async function TotalWedgiesWrapper() {
  const total = await api.wedgie.getTotalWedgies();
  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-between gap-4">
      <div className="flex flex-row items-center gap-4 text-3xl leading-none sm:text-wedgies-text">
        <span className="text-[1.5em] font-black text-yellow">{total}</span>
        <div className="gap-.5 flex flex-col">
          <span className="text-[0.6em] font-black uppercase leading-none text-pink">
            Total Wedgies
          </span>
          <span className="mt-[0.2em] text-[0.4em] font-bold uppercase leading-none text-white/50">
            From the 2014/15 season
          </span>
        </div>
      </div>
      <Link
        href="/seasons-history"
        className="block rounded-full border-2 border-yellow bg-yellow px-6 py-1 text-button-text font-black uppercase text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow"
      >
        Seasons History
      </Link>
    </div>
  );
}
