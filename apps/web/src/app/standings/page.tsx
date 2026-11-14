import { ExploreFooter } from "~/components/shared/ExploreFooter";
import { StandingsPage } from "~/components/standings/StandingsPage";
import { PageLayout } from "~/components/layout/PageLayout";
import { generateMetadata } from "~/config/metadata";
import { PageHeading } from "~/components/shared/PageHeading";

export const metadata = generateMetadata({
  title: "Standings",
  description:
    "Players and teams standings, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function Page() {
  return (
    <PageLayout>
      <div className="flex flex-col lg:flex-row">
        <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
          <PageHeading title="Standings" />

          <StandingsPage />
          <ExploreFooter
            className="max-w-3xl md:grid-cols-2"
            links={[
              { title: "All wedgies", url: "/all-wedgies" },
              { title: "Stats for nerds", url: "/stats-for-nerds" },
              { title: "Seasons history", url: "/seasons-history" },
            ]}
          />
        </div>
      </div>
    </PageLayout>
  );
}
