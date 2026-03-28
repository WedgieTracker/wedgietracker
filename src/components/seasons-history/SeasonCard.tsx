interface SeasonCardProps {
  season: {
    name: string;
    totalGames: number;
    totalWedgies: number;
    topPlayers: Array<{
      name: string;
      count: number;
    }>;
    topTeams: Array<{
      name: string;
      count: number;
    }>;
  };
}

export function SeasonCard({ season }: SeasonCardProps) {
  return (
    <div className="bg-darkpurple-dark rounded-lg p-2 py-4 md:p-8 md:py-8">
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-yellow flex items-center text-2xl font-black md:text-4xl">
            {season.name}
            <span className="bg-yellow/20 text-yellow ml-2 rounded-full px-2 py-1 text-xs font-black tracking-wider uppercase md:text-sm">
              Season
            </span>
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2 md:gap-4">
            <div>
              <span className="text-pink text-5xl font-black">
                {season.totalWedgies}
              </span>
              <p className="mt-1 text-xs font-bold text-white/50 uppercase md:text-sm">
                Total Wedgies
              </p>
            </div>
            <div>
              <span className="text-pink text-5xl font-black">
                {season.totalGames}
              </span>
              <p className="mt-1 text-xs font-bold text-white/50 uppercase md:text-sm">
                Games Played
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 md:gap-8">
          <div className="col-span-3">
            <h3 className="text-yellow mb-2 pl-2 leading-none font-black md:mb-3 md:pl-2">
              PLAYERS
            </h3>
            <div className="space-y-1">
              {season.topPlayers.map((player, index) => (
                <div
                  key={player.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="text-pink text-xs font-black md:text-lg">
                      <span className="text-pink/50 text-[10px] md:text-sm">
                        #
                      </span>
                      {index + 1}
                    </span>
                    <span className="text-sm font-black text-white md:text-lg">
                      {player.name}
                    </span>
                  </div>
                  <span className="text-yellow pl-1 text-sm font-black md:text-lg">
                    {player.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <h3 className="text-yellow mb-2 pl-2 leading-none font-black md:mb-3 md:pl-2">
              TEAMS
            </h3>
            <div className="space-y-1">
              {season.topTeams.map((team, index) => (
                <div
                  key={team.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="text-pink text-xs font-black md:text-lg">
                      <span className="text-pink/50 text-[10px] md:text-sm">
                        #
                      </span>
                      {index + 1}
                    </span>
                    <span className="text-sm font-black text-white md:text-lg">
                      {team.name}
                    </span>
                  </div>
                  <span className="text-yellow pl-1 text-sm font-black md:text-lg">
                    {team.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
