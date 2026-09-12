import { Card } from "~/components/ui/card";
import { Loader } from "~/components/shared/Loader";
import { StandingsList } from "./StandingsList";

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
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="mr-[-20px] flex h-full w-full max-w-[150px] items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  const seasonParam = currentSeason || "all";

  return (
    <Card className="md:bg-darkpurple-light/30 w-full overflow-hidden border-none bg-transparent">
      <div className="grid grid-cols-5 gap-3 p-0 md:gap-8 md:p-4">
        <div className="col-span-3">
          <StandingsList
            title="PLAYERS"
            items={players}
            buildHref={(name) => `/all-wedgies?wp=${name}&ws=${seasonParam}`}
            countClassName="pl-2"
          />
        </div>

        <div className="col-span-2">
          <StandingsList
            title="TEAMS"
            items={teams}
            buildHref={(name) => `/all-wedgies?wt=${name}&ws=${seasonParam}`}
            countClassName="pl-2"
          />
        </div>
      </div>
    </Card>
  );
}
