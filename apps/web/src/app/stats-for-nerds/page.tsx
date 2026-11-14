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
      <div className="w-full">
        <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
          <PageHeading title="Stats for nerds" />

          <Suspense fallback={<LoaderWrapper />}>
            <StatsWrapper />
          </Suspense>
          <ExploreFooter
            className="max-w-7xl md:grid-cols-[1.15fr_1fr]"
            links={[
              { title: "All wedgies", url: "/all-wedgies" },
              { title: "Standings", url: "/standings" },
              { title: "Seasons history", url: "/seasons-history" },
            ]}
          />
        </div>
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
  const stats = await api.wedgie.getNerdStats();
  return <StatsForNerds stats={stats} />;
}
