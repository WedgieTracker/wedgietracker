import { StandingsPage } from "~/components/standings/StandingsPage";
import { Header } from "~/components/layout/Header";
import { CircleMenu } from "~/components/layout/CircleMenu";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";

import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Standings",
  description:
    "Players and teams standings, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function Page() {
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        <CircleMenu />
        <div className="flex flex-col lg:flex-row">
          <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
            <h1 className="text-center text-2xl font-black uppercase leading-none md:text-4xl">
              <span className="text-shadow-darkpurple relative z-10 block leading-none text-yellow">
                Players/Teams
              </span>
              <span className="relative z-0 mt-[-.25em] block text-[1.5em] leading-none text-pink">
                Standings
              </span>
            </h1>

            <StandingsPage />
          </div>
        </div>
      </div>
      <Footer />
    </MenuProvider>
  );
}
