"use client";

import { useState } from "react";
import { toast } from "~/hooks/use-toast";

interface CloudinaryUploadProps {
  onUploadComplete: (url: string) => void;
  initialUrl?: string;
}

interface CloudinaryResponse {
  url: string;
}

export function CloudinaryUpload({
  onUploadComplete,
  initialUrl,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    initialUrl ?? null,
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is video
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadedUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = (await response.json()) as CloudinaryResponse;
      setUploadedUrl(data.url);
      onUploadComplete(data.url);

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="file"
          accept="video/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className={`flex cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 bg-white/5 p-6 text-white transition-all hover:border-yellow ${
            uploading ? "opacity-50" : ""
          }`}
        >
          <div className="text-center">
            {uploadedUrl ? (
              <>
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="mt-1 text-sm">
                  Video uploaded - Click to replace
                </p>
              </>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-1 text-sm">
                  {uploading
                    ? `Uploading... ${progress}%`
                    : "Click to upload or drag and drop"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  MP4, WebM, Ogg (max 100MB)
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {uploadedUrl && (
        <div className="mt-2 rounded-md bg-green-500/10 p-3">
          <p className="text-sm text-white">
            <span className="font-semibold">Cloudinary URL:</span>{" "}
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow hover:underline"
            >
              {uploadedUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
