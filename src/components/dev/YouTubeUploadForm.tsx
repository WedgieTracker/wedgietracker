"use client";

import { useState, useEffect } from "react";

import { Preview } from "../admin/Preview";

import type { WedgieWithTypes } from "~/types/wedgie";

interface VideoUrl {
  youtube?: string;
  cloudinary?: string;
  youtubeNoDunks?: string;
  instagram?: string;
}

interface UploadResult {
  success: boolean;
  short?: {
    videoUrl: string;
  };
  original?: {
    videoUrl: string;
  };
  error?: string;
}

interface YouTubeUploadFormProps {
  wedgie: WedgieWithTypes;
}

export function YouTubeUploadForm({ wedgie }: YouTubeUploadFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Set initial values from wedgie
  useEffect(() => {
    setTitle(
      `${wedgie.playerName} WEDGIE No. ${wedgie.number} - ${wedgie.seasonName} season`,
    );
    setDescription(
      `${wedgie.playerName} wedgie during ${wedgie.teamName} vs ${wedgie.teamAgainstName}\n\n` +
        `Number ${wedgie.number} of the ${wedgie.seasonName} season\n\n` +
        `WedgieTracker.com\n` +
        `@NoDunksInc #WeAreWedgie`,
    );
  }, [wedgie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(wedgie.videoUrl as VideoUrl)?.cloudinary) return;

    setUploading(true);
    const formData = new FormData();

    formData.append(
      "videoUrl",
      (wedgie.videoUrl as VideoUrl)?.cloudinary ?? "",
    );
    formData.append("title", title);
    formData.append("description", description);
    formData.append("number", wedgie.number?.toString() ?? "");
    formData.append("season", wedgie.seasonName?.slice(-5) ?? "");
    formData.append("player", wedgie.playerName ?? "");

    try {
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as UploadResult;
      setResult(data);
    } catch {
      setResult({ success: false, error: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-8 rounded-lg bg-white/10 p-6 text-white">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="rounded bg-blue-500 px-3 py-1 text-sm font-bold text-white hover:bg-blue-600"
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>
      {showPreview && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Preview
              number={wedgie.number ?? 0}
              season={wedgie.seasonName?.slice(-5) ?? ""}
              type="short"
              className="mb-4"
            />
            <Preview
              number={wedgie.number ?? 0}
              season={wedgie.seasonName?.slice(-5) ?? ""}
              player={wedgie.playerName ?? ""}
              type="thumbnail"
              className="mb-4"
            />
          </div>

          {(wedgie.videoUrl as VideoUrl)?.cloudinary && (
            <div className="mt-4">
              <video
                src={(wedgie.videoUrl as VideoUrl)?.cloudinary}
                controls
                className="max-h-[200px] rounded"
              />
            </div>
          )}
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-600 bg-gray-700 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-600 bg-gray-700 px-3 py-2"
            rows={6}
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !(wedgie.videoUrl as VideoUrl)?.cloudinary}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 rounded p-3 ${
            result.success ? "bg-green-800/50" : "bg-red-800/50"
          }`}
        >
          {result.success ? (
            <div className="space-y-2">
              <p>Upload successful!</p>
              {result.short?.videoUrl && (
                <p>
                  Short:{" "}
                  <a
                    href={result.short.videoUrl}
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Short
                  </a>
                </p>
              )}
              {result.original?.videoUrl && (
                <p>
                  Original:{" "}
                  <a
                    href={result.original.videoUrl}
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Original
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p>Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
