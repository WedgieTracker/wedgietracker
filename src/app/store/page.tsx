import { Suspense } from "react";
import { Header } from "~/components/layout/Header";
import { CircleMenu } from "~/components/layout/CircleMenu";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";
import { TShirtProduct } from "~/components/store/TShirtProduct";
import { Loader } from "~/components/loader";
import { generateMetadata } from "~/config/metadata";
import { BuyMeACoffee } from "~/components/BuyMeACoffee";

export const metadata = generateMetadata({
  title: "OG Wedgie T-Shirt",
  description: "NBA Wedgie Tracker Store",
});

export default function StorePage() {
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        <CircleMenu />
        <div className="flex flex-col">
          <div className="flex w-full flex-col items-center justify-center gap-8 px-4 py-4 md:gap-8 md:py-8 lg:px-8 lg:py-8">
            <h1 className="text-center text-4xl font-black uppercase leading-none md:text-6xl">
              <span className="text-shadow-darkpurple relative z-10 block leading-none text-yellow">
                Wedgie
              </span>
              <span className="relative z-0 mt-[-.3em] block text-[1.2em] leading-none text-pink">
                Store
              </span>
            </h1>

            <Suspense fallback={<Loader />}>
              <TShirtProduct />

              <div className="max-w-3xl rounded-xl bg-darkpurple-light/30 p-4 text-center md:p-8">
                <h3 className="text-xl font-bold text-yellow">How It Works</h3>
                <p className="mt-4 text-white">
                  Our t-shirt inventory is directly linked to the total number
                  of wedgies! Each time a new wedgie happens, another t-shirt
                  becomes available at 3:00 PM ET.
                  <span className="mt-2 block text-pink">
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
        <Footer />
      </div>
    </MenuProvider>
  );
}
