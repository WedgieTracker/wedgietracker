"use client";

import { useState, type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { toast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import type {
  VideoUrls,
  WedgieWithTypes,
} from "@wedgietracker/core/types/wedgie";
import { hostedVideo } from "@wedgietracker/core/utils/wedgieVideo";

interface SocialPostFormProps {
  wedgie: WedgieWithTypes;
  platformName: string;
  endpoint: string;
  previewSuffix: string;
  headerExtra?: ReactNode;
  preflight?: () => boolean;
}

export function SocialPostForm({
  wedgie,
  platformName,
  endpoint,
  previewSuffix,
  headerExtra,
  preflight,
}: SocialPostFormProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { data: pace } = api.wedgie.getStats.useQuery();

  const generatePreview = () => {
    const baseMessage = `Wedgie No. ${wedgie.number}, on pace for ${pace?.currentPace}\n\n`;
    const userMessage = customMessage ? customMessage : wedgie.playerName;
    return `${baseMessage}${userMessage}${previewSuffix}`;
  };

  const handlePost = async () => {
    if (preflight && !preflight()) return;

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("customMessage", customMessage);
      formData.append("pace", pace?.currentPace.toString() ?? "");

      const videoUrl = hostedVideo(wedgie.videoUrl as VideoUrls | null);
      if (videoUrl) formData.append("videoUrl", videoUrl);
      formData.append("number", wedgie.number.toString() ?? "");

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!data.success) throw new Error(data.error ?? "Unknown error");

      toast({
        title: "Success",
        description: `Posted to ${platformName} successfully!`,
      });
      setCustomMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to post to ${platformName}`,
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-panel text-cream w-full rounded-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="bg-violet text-cream hover:bg-violet rounded px-3 py-1 text-sm font-bold"
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
        {headerExtra}
      </div>

      <div className="mt-4 space-y-4">
        {showPreview && hostedVideo(wedgie.videoUrl as VideoUrls | null) && (
          <div className="mt-4">
            <video
              src={hostedVideo(wedgie.videoUrl as VideoUrls | null)}
              controls
              className="max-h-[200px] w-full rounded"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="social-custom-message"
            className="text-cream mb-2 block text-sm font-medium"
          >
            Custom Message (optional)
          </label>
          <textarea
            id="social-custom-message"
            className="border-violet/20 text-night focus:border-violet focus:ring-violet w-full rounded-md border p-2"
            placeholder="Enter your custom message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="border-violet/20 rounded-md border p-4">
          <h3 className="mb-2 font-semibold">Preview:</h3>
          <p className="text-cream text-sm whitespace-pre-wrap">
            {generatePreview()}
          </p>
        </div>

        <Button
          className="bg-violet hover:bg-violet w-full"
          onClick={handlePost}
          disabled={isPosting}
        >
          {isPosting ? "Posting..." : `Post to ${platformName}`}
        </Button>
      </div>
    </div>
  );
}
