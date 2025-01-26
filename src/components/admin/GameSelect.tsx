"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface Game {
  id: number;
  name: string;
  date: string;
}

interface GameSelectProps {
  wedgieId: number;
  teamName: string;
  teamAgainstName: string;
  seasonName: string;
  wedgieDate: Date;
  onSelect: (
    wedgieId: number,
    data: { gameName: string | null; gameDate: string | null },
  ) => void;
}

export function GameSelect({
  wedgieId,
  teamName,
  teamAgainstName,
  seasonName,
  onSelect,
}: GameSelectProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/games-search?team1=${teamName}&team2=${teamAgainstName}&season=${seasonName}`,
      );
      const data = (await response.json()) as { games: Game[] };
      setGames(data.games);
    } catch (error) {
      console.error("Error fetching games:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        onOpenChange={(open) => {
          if (open && games.length === 0) {
            void fetchGames();
          }
        }}
        onValueChange={(value) => {
          const selectedGame = games.find((g) => g.name === value);
          onSelect(wedgieId, {
            gameName: value,
            gameDate: selectedGame?.date ?? null,
          });
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={loading ? "Loading..." : "Select a game"} />
        </SelectTrigger>
        <SelectContent>
          {games.map((game) => (
            <SelectItem key={game.id} value={game.name}>
              {game.name} ({new Date(game.date).toLocaleDateString()})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
