import { ExploreFooter } from "~/components/shared/ExploreFooter";
import { PageHeading } from "~/components/shared/PageHeading";
import { PageLayout } from "~/components/layout/PageLayout";
import { SeasonsHistoryContent } from "~/components/seasons-history/SeasonsHistoryContent";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Seasons History",
  description:
    "Seasons history, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function SeasonsHistoryPage() {
  return (
    <PageLayout>
      <div className="flex flex-col lg:flex-row">
        <div className="flex w-full flex-col items-center justify-center gap-6 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
          <PageHeading title="Seasons history" />

          <SeasonsHistoryContent />
          <ExploreFooter
            className="max-w-6xl md:grid-cols-[1.15fr_1fr]"
            links={[
              { title: "All wedgies", url: "/all-wedgies" },
              { title: "Stats for nerds", url: "/stats-for-nerds" },
              { title: "Standings", url: "/standings" },
            ]}
          />
        </div>
      </div>
    </PageLayout>
  );
}
