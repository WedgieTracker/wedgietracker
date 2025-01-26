import type { WedgieWithTypes } from "~/types/wedgie";
import { Card } from "~/components/ui/card";
import { Wedgie } from "./Wedgie";
import Link from "next/link";

interface WedgieListProps {
  wedgies: WedgieWithTypes[];
}

export function WedgieList({ wedgies }: WedgieListProps) {
  return (
    <Card className="w-full max-w-2xl overflow-hidden rounded-sm border-none bg-darkpurple shadow-lg">
      <div className="p-2 md:p-4">
        {wedgies.slice(0, 3).map((wedgie) => (
          <Wedgie key={wedgie.id} wedgie={wedgie} />
        ))}
      </div>
      <Link
        href="/all-wedgies"
        className="text-button-text block w-full rounded-b-lg border-2 border-yellow bg-yellow py-1 text-center font-black text-darkpurple transition-all duration-300 hover:border-yellow hover:bg-darkpurple hover:text-yellow md:py-2"
      >
        WATCH THEM ALL
      </Link>
    </Card>
  );
}
