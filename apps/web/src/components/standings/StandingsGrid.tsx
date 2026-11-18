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
  tab?: "players" | "teams";
  onTabChange?: (tab: "players" | "teams") => void;
}

export function StandingsGrid({
  players,
  teams,
  isLoading,
  currentSeason,
  tab,
  onTabChange,
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
      tab={tab}
      onTabChange={onTabChange}
    />
  );
}
