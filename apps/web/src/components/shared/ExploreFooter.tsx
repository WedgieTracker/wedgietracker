import { Suspense } from "react";
import { Cta } from "./Cta";
import {
  CoffeeScoreboardLive,
  CoffeeScoreboardSkeleton,
} from "~/components/home/CoffeeScoreboardLive";

/**
 * The foot of the inner pages: links to the other pages and the newsletter on
 * one side, the Coffees vs Wedgies board on the other. Stacked on phones.
 */
export function ExploreFooter({
  links,
}: {
  links: { title: string; url: string }[];
}) {
  return (
    <div className="mx-auto mt-8 grid w-full max-w-5xl items-start gap-6 md:mt-12 md:grid-cols-[1.15fr_1fr]">
      <Cta links={links} />
      <Suspense fallback={<CoffeeScoreboardSkeleton />}>
        <CoffeeScoreboardLive />
      </Suspense>
    </div>
  );
}
