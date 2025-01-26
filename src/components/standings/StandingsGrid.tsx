import Link from "next/link";
import { Card } from "~/components/ui/card";
import { Loader } from "~/components/loader";
interface StandingsGridProps {
  players: Array<{
    name: string;
    count: number;
  }>;
  teams: Array<{
    name: string;
    count: number;
  }>;
  isLoading: boolean;
  currentSeason: string;
}

export function StandingsGrid({
  players,
  teams,
  isLoading,
  currentSeason,
}: StandingsGridProps) {
  const calculateRanks = (items: Array<{ count: number }>) => {
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
  };

  const playerRanks = calculateRanks(players);
  const teamRanks = calculateRanks(teams);

  const sizes = {
    number: "clamp(0.875rem, 0.8rem + 0.5vw, 1.125rem)",
    hash: "clamp(0.75rem, 0.7rem + 0.3vw, 0.875rem)",
    title: "clamp(1.2rem, .8rem + .5vw, 1.75rem)",
    name: "clamp(.85rem, 0.75rem + 0.5vw, 1.25rem)",
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="mr-[-20px] flex h-full w-full max-w-[150px] items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full overflow-hidden border-none bg-transparent md:bg-darkpurple-light/30">
      <div className="grid grid-cols-5 gap-3 p-0 md:gap-8 md:p-4">
        <div className="col-span-3">
          <h2
            className="mb-2 pl-2 font-black leading-none text-yellow md:mb-3"
            style={{ fontSize: sizes.title }}
          >
            PLAYERS
          </h2>
          <div className="space-y-1">
            {players.map((player, index) => (
              <Link
                key={player.name}
                href={`/all-wedgies?wp=${player.name}&ws=${currentSeason}`}
                className="group flex cursor-pointer items-center justify-between rounded-sm bg-darkpurple-light/30 p-1.5 transition-all duration-300 hover:bg-darkpurple-light/80 md:p-2"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-black ${playerRanks[index]?.isRepeated ? "text-pink/50" : "text-pink"}`}
                    style={{ fontSize: sizes.number }}
                  >
                    <span
                      className={`${sizes.hash} ${playerRanks[index]?.isRepeated ? "text-pink/20" : "text-pink/50"}`}
                    >
                      #
                    </span>
                    {playerRanks[index]?.rank}
                  </span>
                  <span
                    className="font-black text-white transition-all duration-300 group-hover:text-yellow"
                    style={{ fontSize: sizes.name }}
                  >
                    {player.name}
                  </span>
                </div>
                <span
                  className="pl-2 font-black text-yellow"
                  style={{ fontSize: sizes.name }}
                >
                  {player.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <h2
            className="mb-2 pl-2 font-black leading-none text-yellow md:mb-3"
            style={{ fontSize: sizes.title }}
          >
            TEAMS
          </h2>
          <div className="space-y-1">
            {teams.map((team, index) => (
              <Link
                key={team.name}
                href={`/all-wedgies?wt=${team.name}&ws=${currentSeason}`}
                className="group flex cursor-pointer items-center justify-between rounded-sm bg-darkpurple-light/30 p-1.5 transition-all duration-300 hover:bg-darkpurple-light/80 md:p-2"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-black ${teamRanks[index]?.isRepeated ? "text-pink/50" : "text-pink"}`}
                    style={{ fontSize: sizes.number }}
                  >
                    <span
                      className={`${sizes.hash} ${teamRanks[index]?.isRepeated ? "text-pink/20" : "text-pink/50"}`}
                    >
                      #
                    </span>
                    {teamRanks[index]?.rank}
                  </span>
                  <span
                    className="font-black text-white transition-all duration-300 group-hover:text-yellow"
                    style={{ fontSize: sizes.name }}
                  >
                    {team.name}
                  </span>
                </div>
                <span
                  className="pl-2 font-black text-yellow"
                  style={{ fontSize: sizes.name }}
                >
                  {team.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
