import { Loader } from "~/components/shared/Loader";
import { PlayersTeams } from "./PlayersTeams";

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

  return (
    <PlayersTeams
      players={players}
      teams={teams}
      season={currentSeason || ""}
      limit={20}
    />
  );
}
