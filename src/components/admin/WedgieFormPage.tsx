"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { PlayerSearchInput } from "./PlayerSearchInput";
import { TeamSearchInput } from "./TeamSearchInput";
import { GameSearchInput } from "./GameSearchInput";
import { CourtPositionPicker } from "./CourtPositionPicker";
import { TypeSearchInput } from "./TypeSearchInput";
import type { WedgieWithTypes } from "~/types/wedgie";
import { WedgieSocialShareWrapper } from "~/components/admin/WedgieSocialShareWrapper";
import { CloudinaryUpload } from "~/components/admin/CloudinaryUpload";

interface VideoUrls {
  selfHosted?: string;
  cloudinary?: string;
  youtube?: string;
  youtubeNoDunks?: string;
  instagram?: string;
}

interface WedgieFormData {
  playerName: string;
  teamName: string;
  teamAgainstName: string;
  number: number;
  seasonName: string;
  wedgieDate: Date;
  position: { x: number; y: number } | null;
  videoUrl: VideoUrls;
  types: string[];
  gameName: string;
}

interface WedgieFormPageProps {
  wedgie?: WedgieWithTypes;
  currentSeason?: string;
}

export function WedgieFormPage({ wedgie, currentSeason }: WedgieFormPageProps) {
  const router = useRouter();
  console.log(wedgie?.position);
  const [formData, setFormData] = useState<WedgieFormData>({
    playerName: wedgie?.playerName ?? "",
    teamName: wedgie?.teamName ?? "",
    teamAgainstName: wedgie?.teamAgainstName ?? "",
    number: wedgie?.number ?? 0,
    seasonName: wedgie?.seasonName ?? currentSeason ?? "",
    wedgieDate: wedgie?.wedgieDate ? new Date(wedgie.wedgieDate) : new Date(),
    position: wedgie?.position
      ? (wedgie.position as { x: number; y: number })
      : null,
    videoUrl: {
      selfHosted: (wedgie?.videoUrl as VideoUrls)?.selfHosted ?? "",
      cloudinary: (wedgie?.videoUrl as VideoUrls)?.cloudinary ?? "",
      youtube: (wedgie?.videoUrl as VideoUrls)?.youtube ?? "",
      youtubeNoDunks: (wedgie?.videoUrl as VideoUrls)?.youtubeNoDunks ?? "",
      instagram: (wedgie?.videoUrl as VideoUrls)?.instagram ?? "",
    },
    types: wedgie?.types?.map((t) => t.name) ?? [],
    gameName: wedgie?.gameName ?? "",
  });

  const createMutation = api.wedgie.create.useMutation();
  const updateMutation = api.wedgie.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (wedgie?.id) {
        await updateMutation.mutateAsync({
          id: wedgie.id,
          data: {
            ...formData,
            position: formData.position
              ? {
                  x: Number(formData.position.x),
                  y: Number(formData.position.y),
                }
              : null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...formData,
          position: formData.position
            ? {
                x: Number(formData.position.x),
                y: Number(formData.position.y),
              }
            : null,
        });
      }

      // Only navigate after the mutation is complete
      router.push("/admin/wedgies");
      router.refresh();
    } catch (error) {
      console.error("Error submitting wedgie:", error);
      // Handle error appropriately (show error message to user)
    }
  };

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
            <label className="block text-sm font-medium text-white">
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
            <label className="block text-sm font-medium text-white">
              Wedgie Number
            </label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) =>
                setFormData({ ...formData, number: parseInt(e.target.value) })
              }
              className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
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
            <label className="block text-sm font-medium text-white">
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
            <label className="block text-sm font-medium text-white">Date</label>
            <input
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
            <label className="block text-sm font-medium text-white">
              Season
            </label>
            <input
              type="text"
              value={formData.seasonName}
              onChange={(e) =>
                setFormData({ ...formData, seasonName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Game</label>
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
            <label className="block text-sm font-medium text-white">
              Types
            </label>
            <TypeSearchInput
              value={formData.types}
              onChange={(types) => setFormData({ ...formData, types })}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-white">
              Position
            </label>
            <div className="mt-1">
              <CourtPositionPicker
                position={formData.position ?? { x: 0, y: 0 }}
                onChange={(newPosition) =>
                  setFormData({
                    ...formData,
                    position: newPosition,
                  })
                }
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-white">
              Video URLs
            </label>
            <div className="mt-1 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Self Hosted URL"
                  value={formData.videoUrl.selfHosted ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      videoUrl: {
                        ...formData.videoUrl,
                        selfHosted: e.target.value,
                      },
                    })
                  }
                  className="block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
                />
                {formData.videoUrl.selfHosted && (
                  <span className="absolute right-2 top-2 rounded bg-green-500 px-2 py-1 text-xs font-bold text-black">
                    Self Hosted
                  </span>
                )}
              </div>
              <CloudinaryUpload
                initialUrl={formData.videoUrl.cloudinary}
                onUploadComplete={(url) =>
                  setFormData({
                    ...formData,
                    videoUrl: {
                      ...formData.videoUrl,
                      cloudinary: url,
                    },
                  })
                }
              />
              <div className="relative">
                <input
                  type="text"
                  placeholder="YouTube URL"
                  value={formData.videoUrl.youtube ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      videoUrl: {
                        ...formData.videoUrl,
                        youtube: e.target.value,
                      },
                    })
                  }
                  className="block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
                />
                {formData.videoUrl.youtube && (
                  <span className="absolute right-2 top-2 rounded bg-green-500 px-2 py-1 text-xs font-bold text-black">
                    YouTube
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="YouTube No Dunks URL"
                  value={formData.videoUrl.youtubeNoDunks ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      videoUrl: {
                        ...formData.videoUrl,
                        youtubeNoDunks: e.target.value,
                      },
                    })
                  }
                  className="block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
                />
                {formData.videoUrl.youtubeNoDunks && (
                  <span className="absolute right-2 top-2 rounded bg-green-500 px-2 py-1 text-xs font-bold text-black">
                    YouTube No Dunks
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Instagram URL"
                  value={formData.videoUrl.instagram ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      videoUrl: {
                        ...formData.videoUrl,
                        instagram: e.target.value,
                      },
                    })
                  }
                  className="block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
                />
                {formData.videoUrl.instagram && (
                  <span className="absolute right-2 top-2 rounded bg-green-500 px-2 py-1 text-xs font-bold text-black">
                    Instagram
                  </span>
                )}
              </div>
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
