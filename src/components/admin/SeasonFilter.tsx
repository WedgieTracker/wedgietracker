"use client";

export function SeasonFilter({
  seasons,
  onSeasonChange,
}: {
  seasons: {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    totalGames: number;
  }[];
  onSeasonChange: (season: string) => void;
}) {
  return (
    <select
      className="mb-4 mt-4 rounded-lg bg-white p-2"
      onChange={(e) => onSeasonChange(e.target.value)}
    >
      {seasons.map((season) => (
        <option key={season.id} value={season.name}>
          {season.name}
        </option>
      ))}
    </select>
  );
}
