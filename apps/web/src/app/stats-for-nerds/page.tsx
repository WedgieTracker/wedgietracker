import { ExploreFooter } from "~/components/shared/ExploreFooter";
import { PageHeading } from "~/components/shared/PageHeading";
import { Suspense } from "react";
import { api } from "~/trpc/server";
import { PageLayout } from "~/components/layout/PageLayout";
import { StatsForNerds } from "~/components/stats-for-nerds/StatsForNerds";
import { Loader } from "~/components/shared/Loader";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Stats for Nerds",
  description:
    "Stats for nerds, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function StatsForNerdsPage() {
  return (
    <PageLayout>
      <div className="flex w-full flex-col items-center pt-4 md:pt-8">
        <PageHeading title="Stats for nerds" />
        <Suspense fallback={<LoaderWrapper />}>
          <StatsWrapper />
        </Suspense>
      </div>
      <div className="px-4 pb-12 lg:px-8">
        <ExploreFooter
          className="max-w-7xl md:grid-cols-[1.15fr_1fr]"
          links={[
            { title: "All wedgies", url: "/all-wedgies" },
            { title: "Standings", url: "/standings" },
            { title: "Seasons history", url: "/seasons-history" },
          ]}
        />
      </div>
    </PageLayout>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex h-full min-h-svh w-full justify-center">
      <div className="items-top mr-[-30px] flex h-full w-full max-w-[150px] justify-center">
        <Loader />
      </div>
    </div>
  );
};

async function StatsWrapper() {
  const [stats, extras] = await Promise.all([
    api.wedgie.getNerdStats(),
    api.wedgie.getNerdExtras(),
  ]);
  return <StatsForNerds stats={stats} extras={extras} />;
}
