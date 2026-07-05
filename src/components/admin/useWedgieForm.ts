"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import type { WedgieWithTypes, VideoUrls } from "~/types/wedgie";

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

function initialFormData(
  wedgie?: WedgieWithTypes,
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
      cloudinary: video.cloudinary ?? "",
      youtube: video.youtube ?? "",
      youtubeNoDunks: video.youtubeNoDunks ?? "",
      instagram: video.instagram ?? "",
    },
    types: wedgie?.types?.map((t) => t.name) ?? [],
    gameName: wedgie?.gameName ?? "",
  };
}

function normalizePosition(formData: WedgieFormData) {
  return {
    ...formData,
    position: formData.position
      ? { x: Number(formData.position.x), y: Number(formData.position.y) }
      : null,
  };
}

export function useWedgieForm(
  wedgie?: WedgieWithTypes,
  currentSeason?: string,
) {
  const router = useRouter();
  const [formData, setFormData] = useState<WedgieFormData>(() =>
    initialFormData(wedgie, currentSeason),
  );

  const createMutation = api.wedgie.create.useMutation();
  const updateMutation = api.wedgie.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = normalizePosition(formData);
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
