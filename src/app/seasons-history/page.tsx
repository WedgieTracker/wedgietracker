export const dynamic = "force-static";
export const revalidate = 300;

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
          <h1 className="text-center text-4xl font-black uppercase leading-none md:mb-8 md:text-5xl">
            <span className="text-shadow-darkpurple relative z-10 block leading-none text-yellow">
              Seasons
            </span>
            <span className="relative z-0 mt-[-.3em] block text-[1.1em] leading-none text-pink">
              History
            </span>
          </h1>

          <SeasonsHistoryContent />
        </div>
      </div>
    </PageLayout>
  );
}
