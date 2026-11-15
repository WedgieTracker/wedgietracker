"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import type {
  WedgieWithTypes,
  VideoUrls,
} from "@wedgietracker/core/types/wedgie";
import { hostedVideo } from "@wedgietracker/core/utils/wedgieVideo";
import { gameLabelWithDate } from "@wedgietracker/core/utils/game";

/** A wedgie as the edit page loads it, with its game when it has one. */
export type EditableWedgie = WedgieWithTypes & {
  game?: {
    name: string;
    homeTeam: string | null;
    awayTeam: string | null;
    gameDate: string | null;
  } | null;
};

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
  gameId: number | null;
  gameName: string;
  /** What the game input shows; only the game picked from it is saved. */
  gameText: string;
  shoutouts: string[];
}

function initialFormData(
  wedgie?: EditableWedgie,
  currentSeason?: string,
): WedgieFormData {
  const video = (wedgie?.videoUrl as VideoUrls | undefined) ?? {};
  return {
    playerName: wedgie?.playerName ?? "",
    teamName: wedgie?.teamName ?? "",
    teamAgainstName: wedgie?.teamAgainstName ?? "",
    number: wedgie?.number ?? 0,
    seasonName: wedgie?.seasonName ?? currentSeason ?? "",
    wedgieDate: wedgie?.wedgieDate ? new Date(wedgie.wedgieDate) : new Date(),
    position: wedgie?.position ?? null,
    videoUrl: {
      hosted: hostedVideo(video) ?? "",
      youtube: video.youtube ?? "",
      youtubeNoDunks: video.youtubeNoDunks ?? "",
      instagram: video.instagram ?? "",
    },
    types: wedgie?.types?.map((t) => t.name) ?? [],
    gameId: wedgie?.gameId ?? null,
    gameName: wedgie?.gameName ?? "",
    gameText: wedgie?.game
      ? gameLabelWithDate(wedgie.game)
      : wedgie?.gameName
        ? gameLabelWithDate({ name: wedgie.gameName })
        : "",
    shoutouts: wedgie?.shoutouts ?? [],
  };
}

function toPayload({ gameText: _shown, ...formData }: WedgieFormData) {
  return {
    ...formData,
    position: formData.position
      ? { x: Number(formData.position.x), y: Number(formData.position.y) }
      : null,
  };
}

export function useWedgieForm(wedgie?: EditableWedgie, currentSeason?: string) {
  const router = useRouter();
  const [formData, setFormData] = useState<WedgieFormData>(() =>
    initialFormData(wedgie, currentSeason),
  );

  const createMutation = api.wedgie.create.useMutation();
  const updateMutation = api.wedgie.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = toPayload(formData);
      if (wedgie?.id) {
        await updateMutation.mutateAsync({ id: wedgie.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.push("/admin/wedgies");
      router.refresh();
    } catch (error) {
      console.error("Error submitting wedgie:", error);
    }
  };

  return { formData, setFormData, handleSubmit, router };
}
