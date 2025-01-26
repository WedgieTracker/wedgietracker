"use client";

import { api } from "~/trpc/react";

type VideoUrl = {
  selfHosted: string;
  youtube: string;
};

export function VideoList() {
  const { data: wedgies, isLoading } =
    api.wedgie.getSelfHostedVideos.useQuery();

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!wedgies || wedgies.length === 0) {
    return <div className="text-white">No self-hosted videos found.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {wedgies.map((wedgie) => (
        <div
          key={wedgie.id}
          className="rounded-lg bg-white/10 p-6 text-white shadow-sm"
        >
          <h3 className="text-lg font-semibold">
            {wedgie.playerName} - {wedgie.teamName} vs {wedgie.teamAgainstName}
          </h3>
          <p className="mt-2 text-sm text-gray-300">
            {wedgie.wedgieDate.toLocaleDateString()}
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href={(wedgie?.videoUrl as VideoUrl)?.selfHosted}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View Video →
            </a>
            <a
              href={`/admin/wedgies/${wedgie.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Edit Wedgie →
            </a>
          </div>
          {!(wedgie?.videoUrl as VideoUrl)?.youtube && (
            <p className="mt-2 text-sm text-gray-300">
              No YouTube video found.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
