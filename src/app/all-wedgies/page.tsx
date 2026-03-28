import { AllWedgiesPage } from "~/components/all-wedgies/AllWedgiesPage";
import { PageLayout } from "~/components/layout/PageLayout";
import { Suspense } from "react";
import { Loader } from "~/components/shared/Loader";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "All Wedgies",
  description:
    "All wedgies, how many times a basketball gets stuck between the backboard and the rim.",
});

export default async function Page() {
  return (
    <PageLayout>
      <div className="flex flex-col lg:flex-row">
        <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
          <h1 className="text-center text-6xl leading-none font-black uppercase md:text-7xl">
            <span className="text-shadow-darkpurple text-yellow relative z-10 block leading-none">
              All{" "}
            </span>
            <span className="text-pink relative z-0 mt-[-.4em] block text-[.5em] leading-none">
              Wedgies
            </span>
          </h1>

          <Suspense fallback={<LoaderWrapper />}>
            <AllWedgiesPage />
          </Suspense>
        </div>
      </div>
    </PageLayout>
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
