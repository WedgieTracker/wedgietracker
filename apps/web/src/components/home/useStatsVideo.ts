"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type EncodingMethod,
  type ShareableStats,
  type VideoFormat,
  buildVideoFilename,
  pickFileExtension,
} from "./stats-video-helpers";

export interface StatsVideo {
  blob: Blob;
  url: string;
  filename: string;
  format: VideoFormat;
  method: EncodingMethod;
  renderMs: number;
}

export type StatsVideoStatus =
  | { kind: "idle" }
  | { kind: "rendering"; progress: number }
  | { kind: "done"; video: StatsVideo }
  | { kind: "error"; message: string };

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useStatsVideo(stats: ShareableStats) {
  const [format, setFormat] = useState<VideoFormat>("portrait");
  const [status, setStatus] = useState<StatsVideoStatus>({ kind: "idle" });
  const controllerRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  const releaseUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  // Stop any render and free the file when the component goes away.
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const generate = useCallback(async () => {
    cancel();
    releaseUrl();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus({ kind: "rendering", progress: 0 });

    // Only re-render when the shown percentage moves, not on every frame.
    let shown = -1;
    const onProgress = (fraction: number) => {
      const percent = Math.floor(fraction * 100);
      if (percent === shown || controller.signal.aborted) return;
      shown = percent;
      setStatus({ kind: "rendering", progress: percent / 100 });
    };

    try {
      // Loaded on demand: the encoder is only needed once someone asks.
      const { renderStatsVideo } = await import("./stats-video-render");
      const result = await renderStatsVideo({
        stats,
        format,
        signal: controller.signal,
        onProgress,
      });
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(result.blob);
      urlRef.current = url;
      setStatus({
        kind: "done",
        video: {
          blob: result.blob,
          url,
          filename: buildVideoFilename(
            new Date(),
            pickFileExtension(result.mimeType),
            format,
          ),
          format,
          method: result.method,
          renderMs: result.renderMs,
        },
      });
    } catch (error) {
      if (isAbort(error) || controller.signal.aborted) {
        setStatus({ kind: "idle" });
        return;
      }
      console.error("Error generating video:", error);
      setStatus({
        kind: "error",
        message:
          error instanceof Error && error.name === "VideoUnsupportedError"
            ? "This browser can't make videos. Try the latest Chrome, Edge, Safari or Firefox."
            : "Something went wrong making the video. Try again.",
      });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [cancel, releaseUrl, stats, format]);

  const stop = useCallback(() => {
    cancel();
    setStatus({ kind: "idle" });
  }, [cancel]);

  const reset = useCallback(() => {
    cancel();
    releaseUrl();
    setStatus({ kind: "idle" });
  }, [cancel, releaseUrl]);

  return { format, setFormat, status, generate, cancel: stop, reset };
}

export function downloadVideo(video: StatsVideo) {
  const a = document.createElement("a");
  a.href = video.url;
  a.download = video.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function canShareVideo(video: StatsVideo): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  const file = new File([video.blob], video.filename, {
    type: video.blob.type,
  });
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function shareVideo(video: StatsVideo) {
  const file = new File([video.blob], video.filename, {
    type: video.blob.type,
  });
  try {
    await navigator.share({ files: [file], title: "WedgieTracker" });
  } catch (error) {
    // Closing the share sheet is not an error worth showing.
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      throw error;
    }
  }
}
