import Link from "next/link";
import { cn } from "~/lib/utils";

const standingsSizes = {
  number: "clamp(0.875rem, 0.8rem + 0.5vw, 1.125rem)",
  hash: "clamp(0.75rem, 0.7rem + 0.3vw, 0.875rem)",
  title: "clamp(1.2rem, .8rem + .5vw, 1.75rem)",
  name: "clamp(.85rem, 0.75rem + 0.5vw, 1.25rem)",
};

function calculateRanks<T extends { count: number }>(items: T[]) {
  let currentRank = 1;
  let previousCount = items[0]?.count ?? 0;
  let isRepeatedRank = false;

  return items.map((item, index) => {
    if (index > 0) {
      isRepeatedRank = item.count === previousCount;
      if (!isRepeatedRank) {
        currentRank += 1;
      }
    }
    previousCount = item.count;
    return { rank: currentRank, isRepeated: isRepeatedRank };
  });
}

interface StandingsListProps {
  title: string;
  items: Array<{ name: string; count: number }>;
  buildHref: (name: string) => string;
  titleClassName?: string;
  countClassName?: string;
}

export function StandingsList({
  title,
  items,
  buildHref,
  titleClassName = "pl-2",
  countClassName = "pr-2",
}: StandingsListProps) {
  const ranks = calculateRanks(items);

  return (
    <>
      <h2
        className={cn(
          "text-yellow mb-2 leading-none font-black md:mb-3",
          titleClassName,
        )}
        style={{ fontSize: standingsSizes.title }}
      >
        {title}
      </h2>
      <div className="space-y-1">
        {items.map((item, index) => (
          <Link
            key={item.name}
            href={buildHref(item.name)}
            className="group bg-darkpurple-light/30 hover:bg-darkpurple-light/80 flex cursor-pointer items-center justify-between rounded-sm p-1.5 transition-all duration-300 md:p-2"
          >
            <div className="flex items-baseline gap-2">
              <span
                className={`font-black ${ranks[index]?.isRepeated ? "text-pink/50" : "text-pink"}`}
                style={{ fontSize: standingsSizes.number }}
              >
                <span
                  className={`${standingsSizes.hash} ${
                    ranks[index]?.isRepeated ? "text-pink/20" : "text-pink/50"
                  }`}
                >
                  #
                </span>
                {ranks[index]?.rank}
              </span>
              <span
                className="group-hover:text-yellow font-black text-white transition-all duration-300"
                style={{ fontSize: standingsSizes.name }}
              >
                {item.name}
              </span>
            </div>
            <span
              className={cn("text-yellow font-black", countClassName)}
              style={{ fontSize: standingsSizes.name }}
            >
              {item.count}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
