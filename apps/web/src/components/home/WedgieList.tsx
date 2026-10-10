"use client";

import type { WedgieWithTypes } from "@wedgietracker/core/types/wedgie";
import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Wedgie } from "./Wedgie";
import { WedgieModal } from "./WedgieModal";
import Link from "next/link";

interface WedgieListProps {
  wedgies: WedgieWithTypes[];
}

export function WedgieList({ wedgies }: WedgieListProps) {
  const latest = wedgies.slice(0, 3);
  // One modal for the list, so its arrows can step between the three wedgies
  // shown (each card's own modal has no neighbours to step to).
  const [selected, setSelected] = useState<number | null>(null);
  const wedgie = selected === null ? null : latest[selected];

  return (
    <Card className="bg-darkpurple w-full max-w-2xl overflow-hidden rounded-sm border-none shadow-lg">
      <div className="p-2 md:p-4">
        {latest.map((w, i) => (
          <Wedgie key={w.id} wedgie={w} onWedgieClick={() => setSelected(i)} />
        ))}
      </div>
      <Link
        href="/all-wedgies"
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:border-yellow hover:bg-darkpurple hover:text-yellow block w-full rounded-b-lg border-2 py-1 text-center font-black transition-all duration-300 md:py-2"
      >
        WATCH THEM ALL
      </Link>

      {wedgie && selected !== null && (
        <WedgieModal
          wedgie={wedgie}
          isOpen
          onClose={() => setSelected(null)}
          hasPrevious={selected > 0}
          hasNext={selected < latest.length - 1}
          onPrevious={() => setSelected((i) => (i && i > 0 ? i - 1 : i))}
          onNext={() =>
            setSelected((i) =>
              i !== null && i < latest.length - 1 ? i + 1 : i,
            )
          }
        />
      )}
    </Card>
  );
}
