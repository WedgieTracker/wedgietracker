import { PageLayout } from "~/components/layout/PageLayout";
import { CoffeeStack } from "~/components/support/CoffeeStack";
import { ExploreFooter } from "~/components/shared/ExploreFooter";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Support Us",
  description:
    "WedgieTracker is one person in London. Buy a coffee to keep the tracker running.",
});

export default function SupportUsPage() {
  return (
    <PageLayout>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-[18px] py-8 md:py-12">
        <div>
          <h1 className="text-cream text-[32px] leading-none font-black tracking-[-0.03em] md:text-5xl">
            Buy me a coffee
          </h1>
          <p className="text-cream/70 mt-3 text-[15px] leading-relaxed font-bold">
            WedgieTracker is one person in London, logging every wedgie since
            2014/15. Coffees keep the tracker running.
          </p>
        </div>
        <CoffeeStack />
        <ExploreFooter
          className="max-w-xl"
          links={[
            { title: "All wedgies", url: "/all-wedgies" },
            { title: "Standings", url: "/standings" },
            { title: "Stats for nerds", url: "/stats-for-nerds" },
          ]}
        />
      </div>
    </PageLayout>
  );
}
