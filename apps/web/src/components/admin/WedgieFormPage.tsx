"use client";

import { PlayerSearchInput } from "./PlayerSearchInput";
import { TeamSearchInput } from "./TeamSearchInput";
import { GameSearchInput } from "./GameSearchInput";
import { CourtPositionPicker } from "./CourtPositionPicker";
import { TypeSearchInput } from "./TypeSearchInput";
import { VideoUrlInput } from "./VideoUrlInput";
import { useWedgieForm } from "./useWedgieForm";
import { ShoutoutsInput } from "./ShoutoutsInput";
import type { EditableWedgie } from "./useWedgieForm";
import { WedgieSocialShareWrapper } from "~/components/admin/WedgieSocialShareWrapper";
import { VideoUpload } from "~/components/admin/VideoUpload";

interface WedgieFormPageProps {
  wedgie?: EditableWedgie;
  currentSeason?: string;
}

export function WedgieFormPage({ wedgie, currentSeason }: WedgieFormPageProps) {
  const { formData, setFormData, handleSubmit, router, error } = useWedgieForm(
    wedgie,
    currentSeason,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-cream text-2xl font-bold">
          {wedgie ? "Edit Wedgie" : "Create New Wedgie"}
        </h1>
        <button
          onClick={() => router.back()}
          className="bg-panel-light text-cream hover:bg-panel rounded-md px-4 py-2"
        >
          Back
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-panel space-y-6 rounded-lg p-6"
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="playerName"
              className="text-cream block text-sm font-medium"
            >
              Player Name
            </label>
            <PlayerSearchInput
              value={formData.playerName}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, playerName: value }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="wedgieNumber"
              className="text-cream block text-sm font-medium"
            >
              Wedgie Number
            </label>
            <input
              id="wedgieNumber"
              type="number"
              value={formData.number}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  number: parseInt(e.target.value),
                }))
              }
              className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
            />
          </div>

          <div>
            <label
              htmlFor="teamName"
              className="text-cream block text-sm font-medium"
            >
              Player&apos;s Team
            </label>
            <TeamSearchInput
              value={formData.teamName}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, teamName: value }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="teamAgainstName"
              className="text-cream block text-sm font-medium"
            >
              Opponent
            </label>
            <TeamSearchInput
              value={formData.teamAgainstName}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, teamAgainstName: value }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="wedgieDate"
              className="text-cream block text-sm font-medium"
            >
              Date
            </label>
            <input
              id="wedgieDate"
              type="date"
              value={formData.wedgieDate.toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  wedgieDate: new Date(e.target.value),
                }))
              }
              className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
            />
          </div>

          <div>
            <label
              htmlFor="seasonName"
              className="text-cream block text-sm font-medium"
            >
              Season
            </label>
            <input
              id="seasonName"
              type="text"
              value={formData.seasonName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, seasonName: e.target.value }))
              }
              className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
            />
          </div>

          <div>
            <label
              htmlFor="gameName"
              className="text-cream block text-sm font-medium"
            >
              Game
            </label>
            <GameSearchInput
              value={formData.gameText}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  gameText: value,
                  // emptying the box takes the wedgie off its game (GEMS have none)
                  ...(value.trim() === "" && { gameId: null, gameName: "" }),
                }))
              }
              onGameSelect={(game) => {
                setFormData((prev) => ({
                  ...prev,
                  gameId: game.id,
                  gameName: game.name,
                  gameText: game.label,
                  wedgieDate: game.date,
                  seasonName: game.seasonName,
                }));
              }}
            />
          </div>

          <div>
            <label
              htmlFor="wedgieTypes"
              className="text-cream block text-sm font-medium"
            >
              Types
            </label>
            <TypeSearchInput
              value={formData.types}
              onChange={(types) => setFormData((prev) => ({ ...prev, types }))}
            />
          </div>

          <div className="col-span-2">
            <label
              htmlFor="shoutouts"
              className="text-cream block text-sm font-medium"
            >
              Shoutouts (X and Bluesky handles that tagged us)
            </label>
            <ShoutoutsInput
              id="shoutouts"
              value={formData.shoutouts}
              onChange={(shoutouts) =>
                setFormData((prev) => ({ ...prev, shoutouts }))
              }
            />
          </div>

          <div className="col-span-2">
            <label
              htmlFor="courtPosition"
              className="text-cream block text-sm font-medium"
            >
              Position
            </label>
            <div className="mt-1">
              <CourtPositionPicker
                position={formData.position ?? { x: 0, y: 0 }}
                onChange={(newPosition) =>
                  setFormData((prev) => ({ ...prev, position: newPosition }))
                }
              />
            </div>
          </div>

          <div className="col-span-2">
            <label
              htmlFor="videoUrls"
              className="text-cream block text-sm font-medium"
            >
              Video URLs
            </label>
            <div className="mt-1 space-y-2">
              <VideoUpload
                initialUrl={formData.videoUrl.hosted}
                onUploadComplete={(url) =>
                  setFormData((prev) => ({
                    ...prev,
                    videoUrl: { ...prev.videoUrl, hosted: url },
                  }))
                }
              />
              <VideoUrlInput
                placeholder="YouTube URL"
                badge="YouTube"
                value={formData.videoUrl.youtube ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    videoUrl: { ...prev.videoUrl, youtube: value },
                  }))
                }
              />
              <VideoUrlInput
                placeholder="YouTube No Dunks URL"
                badge="YouTube No Dunks"
                value={formData.videoUrl.youtubeNoDunks ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    videoUrl: { ...prev.videoUrl, youtubeNoDunks: value },
                  }))
                }
              />
              <VideoUrlInput
                placeholder="Instagram URL"
                badge="Instagram"
                value={formData.videoUrl.instagram ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    videoUrl: { ...prev.videoUrl, instagram: value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-cream rounded-md bg-[#FF6FD8]/15 p-3">
            {error}
          </p>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-panel-light text-cream hover:bg-panel rounded-md px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-violet text-cream hover:bg-violet/80 rounded-md px-4 py-2"
          >
            {wedgie ? "Update" : "Create"} Wedgie
          </button>
        </div>
      </form>

      {wedgie && (
        <div className="border-violet/20 mt-8 border-t pt-8">
          <WedgieSocialShareWrapper wedgie={wedgie} />
        </div>
      )}
    </div>
  );
}
