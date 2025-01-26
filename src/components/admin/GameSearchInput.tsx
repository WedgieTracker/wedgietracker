import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";

interface Game {
  id: number;
  name: string;
  seasonName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GameSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onGameSelect?: (game: {
    name: string;
    date: Date;
    seasonName: string;
  }) => void;
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
    onChange(game.name);
    setIsOpen(false);
    setSearch("");

    // Extract date from game name (assuming format: "TEAM vs TEAM - DATE")
    const datePart = game.name.split(" - ")[1];
    if (datePart) {
      const gameDate = new Date(datePart);
      onGameSelect?.({
        name: game.name,
        date: gameDate,
        seasonName: game.seasonName ?? "",
      });
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        className="mt-1 block w-full rounded-md border-gray-300 bg-white/10 p-2 text-white"
        placeholder="Search or select a recent game..."
      />
      {isOpen && games.data && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 shadow-lg">
          {games.data.map((game) => (
            <div
              key={game.id}
              className="cursor-pointer px-4 py-2 text-white hover:bg-gray-700"
              onClick={() => handleGameSelect(game)}
            >
              <div className="font-bold">{game.name.split(" - ")[0]}</div>
              <div className="text-sm text-gray-400">
                {new Date(
                  game.name.split(" - ")[1]?.replace("Z", "") ?? "",
                ).toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                  timeZoneName: "short",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
