"use client";

import { useState } from "react";
import { TwitterAuth } from "./TwitterAuth";
import { Button } from "~/components/ui/button";
import { toast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

import type { WedgieWithTypes } from "~/types/wedgie";

interface VideoUrl {
  cloudinary: string;
}

interface TwitterResponse {
  success: boolean;
  error?: string;
}

interface TwitterPostFormProps {
  wedgie: WedgieWithTypes;
}

export function TwitterPostForm({ wedgie }: TwitterPostFormProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // get the pace
  const { data: pace } = api.wedgie.getStats.useQuery();

  const generatePreview = () => {
    const baseMessage = `Wedgie No. ${wedgie.number}, on pace for ${pace?.currentPace}\n\n`;
    const userMessage = customMessage
      ? `${customMessage}`
      : `${wedgie.playerName}`;
    const lastPart = "\n\nWedgieTracker.com";

    return `${baseMessage}${userMessage}${lastPart}`;
  };

  const handleTwitterPost = async () => {
    const twitterToken = localStorage.getItem("twitter_token");
    if (!twitterToken) {
      toast({
        title: "Error",
        description: "Please connect your Twitter account first",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      const formData = new FormData();

      formData.append("customMessage", customMessage);
      formData.append("pace", pace?.currentPace.toString() ?? "");

      const videoUrl =
        typeof wedgie.videoUrl === "object" && wedgie.videoUrl
          ? (wedgie.videoUrl as unknown as VideoUrl).cloudinary
          : null;
      if (videoUrl) {
        formData.append("videoUrl", videoUrl);
      }

      formData.append("number", wedgie.number.toString() ?? "");

      const response = await fetch("/api/twitter/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${twitterToken}`,
        },
        body: formData,
      });

      const data = (await response.json()) as TwitterResponse;

      if (!data.success) {
        throw new Error(data.error ?? "Unknown error");
      }

      toast({
        title: "Success",
        description: "Posted to Twitter successfully!",
      });
      setCustomMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to post to Twitter",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="w-full rounded-lg bg-white/10 p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="rounded bg-blue-500 px-3 py-1 text-sm font-bold text-white hover:bg-blue-600"
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
        <TwitterAuth />
      </div>

      <div className="mt-4 space-y-4">
        {showPreview && (
          <>
            {typeof wedgie.videoUrl === "object" &&
              wedgie.videoUrl &&
              "cloudinary" in wedgie.videoUrl && (
                <div className="mt-4">
                  <video
                    src={wedgie.videoUrl.cloudinary as string}
                    controls
                    className="max-h-[200px] w-full rounded"
                  />
                </div>
              )}
          </>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            Custom Message (optional)
          </label>
          <textarea
            className="w-full rounded-md border border-white/10 p-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your custom message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="rounded-md border border-white/10 p-4">
          <h3 className="mb-2 font-semibold">Preview:</h3>
          <p className="whitespace-pre-wrap text-sm text-white">
            {generatePreview()}
          </p>
        </div>

        <Button
          className="w-full bg-blue-500 hover:bg-blue-600"
          onClick={handleTwitterPost}
          disabled={isPosting}
        >
          {isPosting ? "Posting..." : "Post to Twitter"}
        </Button>
      </div>
    </div>
  );
}
