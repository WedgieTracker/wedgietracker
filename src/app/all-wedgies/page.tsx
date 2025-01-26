import { AllWedgiesPage } from "~/components/all-wedgies/AllWedgiesPage";
import { Header } from "~/components/layout/Header";
import { CircleMenu } from "~/components/layout/CircleMenu";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";
import { Suspense } from "react";
import { Loader } from "~/components/loader";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "All Wedgies",
  description:
    "All wedgies, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function Page() {
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        <CircleMenu />
        <div className="flex flex-col lg:flex-row">
          <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
            <h1 className="text-center text-6xl font-black uppercase leading-none md:text-7xl">
              <span className="text-shadow-darkpurple relative z-10 block leading-none text-yellow">
                All{" "}
              </span>
              <span className="relative z-0 mt-[-.4em] block text-[.5em] leading-none text-pink">
                Wedgies
              </span>
            </h1>

            <Suspense fallback={<LoaderWrapper />}>
              <AllWedgiesPage />
            </Suspense>
          </div>
        </div>
      </div>
      <Footer />
    </MenuProvider>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex w-full justify-center">
      <div className="-mr-[3em] w-full max-w-[100px] md:max-w-[200px]">
        <Loader />
      </div>
    </div>
  );
};
