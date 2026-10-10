import { PageLayout } from "~/components/layout/PageLayout";
import { CoffeeBar } from "~/components/support/CoffeeBar";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Support Us",
  description:
    "WedgieTracker is one person in London. Keep me awake with your coffees.",
});

export default function SupportUsPage() {
  return (
    <PageLayout>
      <div className="flex w-full flex-col items-center gap-8 px-4 py-4 md:py-8 lg:px-8">
        <h1 className="text-center text-4xl leading-none font-black uppercase md:text-6xl">
          <span className="text-shadow-darkpurple text-yellow relative z-10 block leading-none">
            Keep me
          </span>
          <span className="text-pink relative z-0 mt-[-.3em] block text-[1.2em] leading-none">
            awake
          </span>
        </h1>
        <CoffeeBar />
      </div>
    </PageLayout>
  );
}
