import { Suspense } from "react";
import { PageLayout } from "~/components/layout/PageLayout";
import { TShirtProduct } from "~/components/store/TShirtProduct";
import { Loader } from "~/components/shared/Loader";
import { generateMetadata } from "~/config/metadata";
import { BuyMeACoffee } from "~/components/shared/BuyMeACoffee";

export const metadata = generateMetadata({
  title: "OG Wedgie T-Shirt",
  description: "NBA Wedgie Tracker Store",
});

export default async function StorePage() {
  return (
    <PageLayout>
      <div className="flex flex-col">
        <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
          <h1 className="text-center text-4xl leading-none font-black uppercase md:text-6xl">
            <span className="text-shadow-darkpurple text-yellow relative z-10 block leading-none">
              Wedgie
            </span>
            <span className="text-pink relative z-0 mt-[-.3em] block text-[1.2em] leading-none">
              Store
            </span>
          </h1>

          <Suspense fallback={<Loader />}>
            <TShirtProduct />

            <div className="bg-darkpurple-light/30 max-w-3xl rounded-xl p-4 text-center md:p-8">
              <h3 className="text-yellow text-xl font-bold">How It Works</h3>
              <p className="mt-4 text-white">
                Our t-shirt inventory is directly linked to the total number of
                wedgies! Each time a new wedgie happens, another t-shirt becomes
                available at 3:00 PM ET.
                <span className="text-pink mt-2 block">
                  Keep watching for more wedgies to unlock more t-shirts!
                </span>
              </p>
            </div>
          </Suspense>

          <div className="mt-2 flex w-full max-w-3xl justify-center lg:mt-8">
            <BuyMeACoffee />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
