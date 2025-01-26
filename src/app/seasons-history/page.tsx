import { Header } from "~/components/layout/Header";
import { CircleMenu } from "~/components/layout/CircleMenu";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";

import { SeasonsHistoryContent } from "~/components/seasons-history/SeasonsHistoryContent";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Seasons History",
  description:
    "Seasons history, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function SeasonsHistoryPage() {
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        <CircleMenu />
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
      </div>
      <Footer />
    </MenuProvider>
  );
}
