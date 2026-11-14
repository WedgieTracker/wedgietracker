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
  className = "max-w-5xl md:grid-cols-[1.15fr_1fr]",
}: {
  links: { title: string; url: string }[];
  /** The width (to match the page's content) and the columns, if side by side. */
  className?: string;
}) {
  return (
    <div
      className={`mx-auto mt-8 grid w-full items-stretch gap-6 md:mt-12 ${className}`}
    >
      <Cta links={links} />
      <Suspense fallback={<CoffeeScoreboardSkeleton />}>
        <CoffeeScoreboardLive className="flex h-full flex-col justify-between" />
      </Suspense>
    </div>
  );
}
