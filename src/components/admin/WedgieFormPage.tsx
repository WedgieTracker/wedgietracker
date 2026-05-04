"use client";

import { PlayerSearchInput } from "./PlayerSearchInput";
import { TeamSearchInput } from "./TeamSearchInput";
import { GameSearchInput } from "./GameSearchInput";
import { CourtPositionPicker } from "./CourtPositionPicker";
import { TypeSearchInput } from "./TypeSearchInput";
import { VideoUrlInput } from "./VideoUrlInput";
import { useWedgieForm } from "./useWedgieForm";
import type { WedgieWithTypes } from "~/types/wedgie";
import { WedgieSocialShareWrapper } from "~/components/admin/WedgieSocialShareWrapper";
import { CloudinaryUpload } from "~/components/admin/CloudinaryUpload";

interface WedgieFormPageProps {
  wedgie?: WedgieWithTypes;
  currentSeason?: string;
}

export function WedgieFormPage({ wedgie, currentSeason }: WedgieFormPageProps) {
  const { formData, setFormData, handleSubmit, router } = useWedgieForm(
    wedgie,
    currentSeason,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {wedgie ? "Edit Wedgie" : "Create New Wedgie"}
        </h1>
        <button
          onClick={() => router.back()}
          className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Back
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg bg-white/10 p-6"
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-white"
            >
              Player Name
            </label>
            <PlayerSearchInput
              value={formData.playerName}
              onChange={(value) =>
                setFormData({ ...formData, playerName: value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="wedgieNumber"
              className="block text-sm font-medium text-white"
            >
              Wedgie Number
            </label>
            <input
              id="wedgieNumber"
              type="number"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: parseInt(e.target.value) })
              }
              className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
            />
          </div>

          <div>
            <label
              htmlFor="homeTeam"
              className="block text-sm font-medium text-white"
            >
              Home Team
            </label>
            <TeamSearchInput
              value={formData.teamName}
              onChange={(value) =>
                setFormData({ ...formData, teamName: value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="awayTeam"
              className="block text-sm font-medium text-white"
            >
              Away Team
            </label>
            <TeamSearchInput
              value={formData.teamAgainstName}
              onChange={(value) =>
                setFormData({ ...formData, teamAgainstName: value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="wedgieDate"
              className="block text-sm font-medium text-white"
            >
              Date
            </label>
            <input
              id="wedgieDate"
              type="date"
              value={formData.wedgieDate.toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  wedgieDate: new Date(e.target.value),
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
            />
          </div>

          <div>
            <label
              htmlFor="seasonName"
              className="block text-sm font-medium text-white"
            >
              Season
            </label>
            <input
              id="seasonName"
              type="text"
              value={formData.seasonName}
              onChange={(e) =>
                setFormData({ ...formData, seasonName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
            />
          </div>

          <div>
            <label
              htmlFor="gameName"
              className="block text-sm font-medium text-white"
            >
              Game
            </label>
            <GameSearchInput
              value={formData.gameName ?? ""}
              onChange={(value) =>
                setFormData({ ...formData, gameName: value })
              }
              onGameSelect={(game) => {
                setFormData({
                  ...formData,
                  gameName: game.name,
                  wedgieDate: game.date,
                  seasonName: game.seasonName,
                });
              }}
            />
          </div>

          <div>
            <label
              htmlFor="wedgieTypes"
              className="block text-sm font-medium text-white"
            >
              Types
            </label>
            <TypeSearchInput
              value={formData.types}
              onChange={(types) => setFormData({ ...formData, types })}
            />
          </div>

          <div className="col-span-2">
            <label
              htmlFor="courtPosition"
              className="block text-sm font-medium text-white"
            >
              Position
            </label>
            <div className="mt-1">
              <CourtPositionPicker
                position={formData.position ?? { x: 0, y: 0 }}
                onChange={(newPosition) =>
                  setFormData({ ...formData, position: newPosition })
                }
              />
            </div>
          </div>

          <div className="col-span-2">
            <label
              htmlFor="videoUrls"
              className="block text-sm font-medium text-white"
            >
              Video URLs
            </label>
            <div className="mt-1 space-y-2">
              <CloudinaryUpload
                initialUrl={formData.videoUrl.cloudinary}
                onUploadComplete={(url) =>
                  setFormData({
                    ...formData,
                    videoUrl: { ...formData.videoUrl, cloudinary: url },
                  })
                }
              />
              <VideoUrlInput
                placeholder="YouTube URL"
                badge="YouTube"
                value={formData.videoUrl.youtube ?? ""}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    videoUrl: { ...formData.videoUrl, youtube: value },
                  })
                }
              />
              <VideoUrlInput
                placeholder="YouTube No Dunks URL"
                badge="YouTube No Dunks"
                value={formData.videoUrl.youtubeNoDunks ?? ""}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    videoUrl: { ...formData.videoUrl, youtubeNoDunks: value },
                  })
                }
              />
              <VideoUrlInput
                placeholder="Instagram URL"
                badge="Instagram"
                value={formData.videoUrl.instagram ?? ""}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    videoUrl: { ...formData.videoUrl, instagram: value },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {wedgie ? "Update" : "Create"} Wedgie
          </button>
        </div>
      </form>

      {wedgie && (
        <div className="mt-8 border-t border-white/10 pt-8">
          <WedgieSocialShareWrapper wedgie={wedgie} />
        </div>
      )}
    </div>
  );
}
