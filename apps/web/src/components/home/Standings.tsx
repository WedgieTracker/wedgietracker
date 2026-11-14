import Link from "next/link";
import { PlayersTeams } from "~/components/standings/PlayersTeams";

interface StandingsProps {
  players: Array<{ name: string; count: number }>;
  teams: Array<{ name: string; count: number }>;
}

/** This season's leaders on the home page. */
export function Standings({ players, teams }: StandingsProps) {
  return (
    <section className="w-full max-w-2xl">
      <h2 className="text-cream mb-4 text-[21px] font-extrabold tracking-[-0.01em]">
        Leaders
      </h2>
      <PlayersTeams players={players} teams={teams} showCount={false} />
      <Link
        href="/standings"
        className="btn-sticker text-button-text mt-[18px]"
      >
        Full standings
      </Link>
    </section>
  );
}
