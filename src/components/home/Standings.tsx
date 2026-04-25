import Link from "next/link";
import { Card } from "~/components/ui/card";
import { StandingsList } from "~/components/standings/StandingsList";

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
  return (
    <Card className="bg-darkpurple-light/30 w-full max-w-2xl overflow-hidden rounded-sm border-none">
      <div className="grid grid-cols-5 gap-8 p-1 py-2 md:p-4 md:py-4">
        <div className="col-span-3">
          <StandingsList
            title="PLAYERS"
            items={players}
            buildHref={(name) => `/all-wedgies?wp=${name}`}
          />
        </div>

        <div className="col-span-2">
          <StandingsList
            title="TEAMS"
            items={teams}
            buildHref={(name) => `/all-wedgies?wt=${name}`}
            titleClassName="pl-4"
          />
        </div>
      </div>

      <Link
        href="/standings"
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:border-yellow hover:text-yellow block w-full rounded-b-lg border-2 py-2 text-center font-black transition-all duration-300 hover:bg-transparent"
      >
        SEE STANDINGS
      </Link>
    </Card>
  );
}
