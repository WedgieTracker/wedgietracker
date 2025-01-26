import Link from "next/link";
import { Card } from "~/components/ui/card";

interface StandingsProps {
  players: Array<{
    name: string;
    count: number;
  }>;
  teams: Array<{
    name: string;
    count: number;
  }>;
}

export function Standings({ players, teams }: StandingsProps) {
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

  return (
    <Card className="w-full max-w-2xl overflow-hidden rounded-sm border-none bg-darkpurple-light/30">
      <div className="grid grid-cols-5 gap-8 p-1 py-2 md:p-4 md:py-4">
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
                href={`/all-wedgies?wp=${player.name}`}
                className="group flex cursor-pointer items-center justify-between rounded-sm bg-darkpurple-light/30 p-1.5 transition-all duration-300 hover:bg-darkpurple-light/80 md:p-2"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-black ${playerRanks[index]?.isRepeated ? "text-pink/50" : "text-pink"}`}
                    style={{ fontSize: sizes.number }}
                  >
                    <span
                      className={`${sizes.hash} ${
                        playerRanks[index]?.isRepeated
                          ? "text-pink/20"
                          : "text-pink/50"
                      }`}
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
                  className="pr-2 font-black text-yellow"
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
            className="mb-2 pl-4 font-black leading-none text-yellow md:mb-3"
            style={{ fontSize: sizes.title }}
          >
            TEAMS
          </h2>
          <div className="space-y-1">
            {teams.map((team, index) => (
              <Link
                key={team.name}
                href={`/all-wedgies?wt=${team.name}`}
                className="group flex cursor-pointer items-center justify-between rounded-sm bg-darkpurple-light/30 p-1.5 transition-all duration-300 hover:bg-darkpurple-light/80 md:p-2"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-black ${teamRanks[index]?.isRepeated ? "text-pink/50" : "text-pink"}`}
                    style={{ fontSize: sizes.number }}
                  >
                    <span
                      className={`${sizes.hash} ${
                        teamRanks[index]?.isRepeated
                          ? "text-pink/20"
                          : "text-pink/50"
                      }`}
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
                  className="pr-2 font-black text-yellow"
                  style={{ fontSize: sizes.name }}
                >
                  {team.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Link
        href="/standings"
        className="block w-full rounded-b-lg border-2 border-yellow bg-yellow py-2 text-center text-button-text font-black text-darkpurple transition-all duration-300 hover:border-yellow hover:bg-transparent hover:text-yellow"
      >
        SEE STANDINGS
      </Link>
    </Card>
  );
}
