import { useState, useEffect, useRef } from "react";
import {
  gameLabel,
  gameLabelWithDate,
  gameMatchup,
  parseGameName,
  wedgieDateForGame,
} from "@wedgietracker/core/utils/game";
import { api } from "~/trpc/react";

interface Game {
  id: number;
  name: string;
  homeTeam: string | null;
  awayTeam: string | null;
  gameDate: string | null;
  seasonName: string | null;
  createdAt: string;
}

export interface SelectedGame {
  id: number;
  name: string;
  /** What the input shows for the game: "POR @ HOU, 2018-03-24". */
  label: string;
  date: Date;
  seasonName: string;
}

interface GameSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onGameSelect?: (game: SelectedGame) => void;
}

function formatDay(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function GameSearchInput({
  value,
  onChange,
  onGameSelect,
}: GameSearchInputProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const games = api.game.search.useQuery({
    search,
    take: search ? 5 : 10,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGameSelect = (game: Game) => {
    const label = gameLabelWithDate(game);
    onChange(label);
    setIsOpen(false);
    setSearch("");
    const date = wedgieDateForGame(game);
    onGameSelect?.({
      id: game.id,
      name: game.name,
      label,
      date: date ? new Date(date) : new Date(game.createdAt),
      seasonName: game.seasonName ?? "",
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        id="gameName"
        type="text"
        value={value}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        className="mt-1 block w-full rounded-md border-gray-300 bg-white/10 p-2 text-white"
        placeholder="Search a game (POR @ HOU, a team, or 2018-03-24)..."
      />
      {isOpen && games.data && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 shadow-lg">
          {games.data.map((game) => {
            const day = game.gameDate ?? parseGameName(game.name)?.gameDate;
            const tip = parseGameName(game.name)?.tip;
            return (
              <button
                type="button"
                key={game.id}
                className="w-full cursor-pointer px-4 py-2 text-left text-white hover:bg-gray-700"
                onClick={() => handleGameSelect(game)}
              >
                <div className="font-bold">{gameLabel(game)}</div>
                <div className="text-sm text-gray-400">
                  {gameMatchup(game)}
                  {day ? `, ${formatDay(day)}` : ""}
                  {tip ? `, ${tip} ET` : ""}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
