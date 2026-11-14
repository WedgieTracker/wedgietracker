"use client";

import { useState } from "react";
import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { StandingsList } from "./StandingsList";

interface Item {
  name: string;
  count: number;
}

/**
 * Players and teams: behind a switch on phones, side by side from md up.
 * Each name links to All wedgies filtered to it.
 */
export function PlayersTeams({
  players,
  teams,
  season,
  limit,
  showCount,
}: {
  players: Item[];
  teams: Item[];
  season?: string;
  limit?: number;
  showCount?: boolean;
}) {
  const [tab, setTab] = useState<"players" | "teams">("players");
  const href = (name: string) =>
    `/all-wedgies?${buildAllWedgiesQuery({ playerOrTeam: name, ...(season !== undefined ? { season } : {}) })}`;

  return (
    <div>
      <div
        role="group"
        aria-label="Players or teams"
        className="mb-2.5 flex rounded-full bg-black/25 p-1 md:hidden"
      >
        {(["players", "teams"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className="text-cream/70 aria-pressed:bg-cream aria-pressed:text-night focus-visible:outline-cream min-h-11 flex-1 rounded-full text-sm font-extrabold capitalize focus-visible:outline-2"
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-3.5 md:grid-cols-2 md:gap-6">
        <StandingsList
          title="Players"
          kind="players"
          items={players}
          buildHref={href}
          limit={limit}
          showCount={showCount}
          className={tab === "players" ? "" : "hidden md:block"}
        />
        <StandingsList
          title="Teams"
          kind="teams"
          items={teams}
          buildHref={href}
          limit={limit}
          showCount={showCount}
          className={tab === "teams" ? "" : "hidden md:block"}
        />
      </div>
    </div>
  );
}
