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
      <PlayersTeams players={players} teams={teams} />
      <Link
        href="/standings"
        className="bg-button text-cream text-button-text focus-visible:outline-cream mt-[18px] flex min-h-[54px] items-center justify-center rounded-full font-black transition-opacity duration-300 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Full standings
      </Link>
    </section>
  );
}
