import { Header } from "~/components/layout/Header";
import { CircleMenu } from "~/components/layout/CircleMenu";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";
import { BlogList } from "~/components/blog/BlogList";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Blog | NBA Wedgie Tracker",
  description: "Latest news and stories about NBA wedgies and more.",
});

export default function BlogPage() {
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
              <span className="relative z-0 mt-[-.3em] block text-[1.4em] leading-none text-pink">
                Blog
              </span>
            </h1>
            <div className="min-h-[60vh] w-full">
              <BlogList />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </MenuProvider>
  );
}
