import { Suspense } from "react";
import { api } from "~/trpc/server";
import { PageLayout } from "~/components/layout/PageLayout";
import { PaceExplainer } from "~/components/stats-for-nerds/PaceExplainer";
import { Loader } from "~/components/shared/Loader";
import { ExploreFooter } from "~/components/shared/ExploreFooter";
import { PageHeading } from "~/components/shared/PageHeading";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "How the Pace Works",
  description:
    "How WedgieTracker projects a season's wedgie total, with a calculator to try it yourself.",
});

export default async function PacePage() {
  return (
    <PageLayout>
      <div className="w-full">
        <div className="flex w-full flex-col items-center justify-center gap-6 px-[18px] py-8 md:gap-8 md:py-12 lg:px-8">
          <PageHeading title="How the pace works" />

          <Suspense fallback={<LoaderWrapper />}>
            <PaceWrapper />
          </Suspense>

          <ExploreFooter
            className="max-w-2xl"
            links={[
              { title: "Stats for nerds", url: "/stats-for-nerds" },
              { title: "All wedgies", url: "/all-wedgies" },
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

async function PaceWrapper() {
  const data = await api.wedgie.getPaceBreakdown();
  return <PaceExplainer data={data} />;
}
