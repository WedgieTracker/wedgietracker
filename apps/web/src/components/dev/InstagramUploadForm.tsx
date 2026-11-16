"use client";

import { useState, useEffect } from "react";
import { Preview } from "../admin/Preview";
import type {
  VideoUrls,
  WedgieWithTypes,
} from "@wedgietracker/core/types/wedgie";
import { hostedVideo } from "@wedgietracker/core/utils/wedgieVideo";
import { usePathname, useSearchParams } from "next/navigation";

type UploadResult = {
  success: boolean;
  reel?: {
    id: string;
    url: string;
  };
  error?: string;
};

interface InstagramUploadFormProps {
  wedgie: WedgieWithTypes;
}

export function InstagramUploadForm({ wedgie }: InstagramUploadFormProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [instagramToken, setInstagramToken] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // First check localStorage for existing token
    const storedToken = localStorage.getItem("instagram_token");
    if (storedToken) {
      setInstagramToken(storedToken);
      console.log("Instagram token found in localStorage");
      return;
    }

    // If no stored token, check URL params for new token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("instagram_token");
    if (token) {
      // Store the new token
      localStorage.setItem("instagram_token", token);
      setInstagramToken(token);

      // Clean up the URL by removing the token
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("instagram_token");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  // Set initial description when wedgie changes
  useEffect(() => {
    setDescription(
      `${wedgie.playerName} #WEDGIE N°${wedgie.number} of the ${wedgie.seasonName} season during ${wedgie.teamName} vs ${wedgie.teamAgainstName}\n\nWedgieTracker.com\n#WeAreWedgie`,
    );
  }, [wedgie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoUrl = hostedVideo(wedgie.videoUrl as VideoUrls | null);
    if (!videoUrl) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("videoUrl", videoUrl);
    formData.append("description", description);
    formData.append("number", wedgie.number?.toString() ?? "");
    formData.append("season", wedgie.seasonName ?? "");
    formData.append("date", wedgie.wedgieDate);
    formData.append("player", wedgie.playerName ?? "");

    try {
      const response = await fetch("/api/instagram/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${instagramToken}`,
        },
      });
      const data = (await response.json()) as UploadResult;
      setResult(data);
    } catch (err) {
      const error = err as Error;
      setResult({ success: false, error: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadThumbnail = async () => {
    const formData = new FormData();
    formData.append("number", wedgie.number?.toString() ?? "");
    formData.append("season", wedgie.seasonName ?? "");
    formData.append("date", wedgie.wedgieDate);
    formData.append("player", wedgie.playerName ?? "");

    try {
      const response = await fetch("/api/instagram/thumbnail", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate thumbnail");
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail_${wedgie.number}_${wedgie.seasonName?.slice(-5)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const error = err as Error;
      console.error("Error downloading thumbnail:", error.message);
    }
  };

  const handleGeneratePreview = async () => {
    const videoUrl = hostedVideo(wedgie.videoUrl as VideoUrls | null);
    if (!videoUrl) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("videoUrl", videoUrl);
    formData.append("description", description);
    formData.append("number", wedgie.number?.toString() ?? "");
    formData.append("season", wedgie.seasonName ?? "");
    formData.append("date", wedgie.wedgieDate);
    formData.append("player", wedgie.playerName ?? "");

    try {
      const response = await fetch("/api/instagram/preview", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        success: boolean;
        previewUrl: string;
      };
      if (data.success) {
        setPreviewUrl(data.previewUrl);
        setPreviewStep(true);
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error generating preview:", error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleInstagramConnect = () => {
    // Add the current path as state parameter
    const currentPath = `${pathname}${searchParams ? `?${String(searchParams)}` : ""}`;
    const authUrl = new URL("/api/auth/instagram", window.location.origin);
    authUrl.searchParams.set("state", currentPath);

    // Navigate to Instagram auth (server will set cookie)
    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem("instagram_token");
    setInstagramToken(null);
    setResult(null);
    setPreviewUrl(null);
    setPreviewStep(false);
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
        {instagramToken && (
          <button
            onClick={handleLogout}
            className="text-cream rounded bg-[#FF6FD8] px-3 py-1 text-sm font-bold hover:bg-[#FF6FD8]/80"
          >
            Disconnect Instagram
          </button>
        )}
      </div>

      {showPreview && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <Preview
              number={wedgie.number ?? 0}
              season={wedgie.seasonName ?? ""}
              date={wedgie.wedgieDate}
              type="short"
              className="mb-4"
            />
            <Preview
              number={wedgie.number ?? 0}
              season={wedgie.seasonName ?? ""}
              date={wedgie.wedgieDate}
              player={wedgie.playerName ?? ""}
              type="thumbnail"
              className="mb-4"
            />
          </div>
        </>
      )}

      {!instagramToken ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleInstagramConnect}
            className="bg-violet text-cream hover:bg-violet block w-full rounded px-4 py-2 text-center font-bold"
          >
            Connect Instagram Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {!previewStep ? (
            <form className="space-y-4">
              {showPreview && (
                <>
                  {hostedVideo(wedgie.videoUrl as VideoUrls | null) && (
                    <div className="mt-4">
                      <video
                        src={hostedVideo(wedgie.videoUrl as VideoUrls | null)}
                        controls
                        className="max-h-[200px] rounded"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label htmlFor="ig-description" className="mb-2 block">
                  Description
                </label>
                <textarea
                  id="ig-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-violet/30 bg-panel w-full rounded border p-2"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadThumbnail}
                  className="bg-panel-light text-cream hover:bg-panel-light disabled:bg-panel-light w-full rounded px-4 py-2 font-bold"
                >
                  Download Thumbnail
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={uploading}
                  className="bg-violet text-cream hover:bg-violet disabled:bg-panel-light w-full rounded px-4 py-2 font-bold"
                >
                  {uploading ? "Generating..." : "Generate Preview"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="border-violet/30 rounded border p-4">
                <h3 className="mb-2 font-bold">Preview</h3>
                <video
                  src={previewUrl ?? ""}
                  controls
                  className="mb-4 w-full rounded"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewStep(false)}
                    className="bg-panel-light text-cream hover:bg-panel-light w-full rounded px-4 py-2 font-bold"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="bg-violet text-cream hover:bg-violet disabled:bg-panel-light w-full rounded px-4 py-2 font-bold"
                  >
                    {uploading ? "Uploading..." : "Upload to Instagram"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="mt-4">
          {result.success ? (
            <div className="text-violet">
              Upload successful!{" "}
              <a
                href={result.reel?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View Reel
              </a>
            </div>
          ) : (
            <div className="text-[#FF6FD8]">Error: {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
