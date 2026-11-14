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
      <h2 className="text-cream mb-4 text-[21px] font-extrabold tracking-[-0.01em]">
        Latest wedgies
      </h2>
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
        className="bg-button text-cream text-button-text focus-visible:outline-cream mt-[18px] flex min-h-[54px] items-center justify-center rounded-full font-black transition-opacity duration-300 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
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
