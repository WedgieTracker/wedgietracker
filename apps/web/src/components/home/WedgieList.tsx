"use client";

import type { WedgieWithTypes } from "@wedgietracker/core/types/wedgie";
import { useState } from "react";
import { Wedgie } from "./Wedgie";
import { FeaturedWedgie } from "./FeaturedWedgie";
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

  const [first, ...rest] = latest;

  return (
    <section className="w-full max-w-2xl">
      <h2 className="sr-only">Latest wedgies</h2>
      {first && <FeaturedWedgie wedgie={first} onOpen={() => setSelected(0)} />}
      <div className="mt-3 flex flex-col gap-2.5">
        {rest.map((w, i) => (
          <Wedgie
            key={w.id}
            wedgie={w}
            onWedgieClick={() => setSelected(i + 1)}
          />
        ))}
      </div>
      <Link
        href="/all-wedgies"
        className="btn-sticker text-button-text mt-[18px]"
      >
        See all wedgies
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
    </section>
  );
}
