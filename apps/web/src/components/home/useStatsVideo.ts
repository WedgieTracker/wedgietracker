"use client";

import { useRef, useState } from "react";
import {
  type ShareableStats,
  INITIAL_WAVE_LAYERS,
  buildVideoFilename,
  pickFileExtension,
  pickSupportedMimeType,
} from "./stats-video-helpers";
import {
  type FrameContext,
  createConfettiParticles,
  drawFrame,
  drawVerticalFrame,
  loadImage,
} from "./stats-video-canvas";

const LOGO_URL =
  "https://res.cloudinary.com/wedgietracker/image/upload/v1737299676/assets/logo-wedgietracker_rlzejd.png";

const DESKTOP_DIMENSIONS = { width: 1920, height: 1080 } as const;
const MOBILE_DIMENSIONS = { width: 1080, height: 1920 } as const;
const VIDEO_DURATION_MS = 10000;
const FRAMES_PER_SECOND = 30;
const VIDEO_BITRATE = 8_000_000;

export type VideoType = "desktop" | "mobile";

export function useStatsVideo(stats: ShareableStats) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoType, setVideoType] = useState<VideoType>("desktop");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateVideo = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dimensions =
        videoType === "desktop" ? DESKTOP_DIMENSIONS : MOBILE_DIMENSIONS;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const fillPercentage = Math.min((stats.totalWedgies / 50) * 100, 100);
      const confettiParticles =
        fillPercentage >= 100
          ? createConfettiParticles(canvas.width, canvas.height)
          : [];

      const logoImage = await loadImage(LOGO_URL);

      const supportedMimeType = pickSupportedMimeType((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      if (!supportedMimeType) {
        throw new Error("No supported media type found");
      }

      const stream = canvas.captureStream(FRAMES_PER_SECOND);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: VIDEO_BITRATE,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        setVideoBlob(new Blob(chunks, { type: supportedMimeType }));
        setIsGenerating(false);
      };

      mediaRecorder.start();

      const frame: FrameContext = {
        ctx,
        waveLayers: INITIAL_WAVE_LAYERS.map((l) => ({ ...l })),
        confettiParticles,
        logoImage,
      };

      const startTime = Date.now();
      const animate = () => {
        const currentProgress = (Date.now() - startTime) / VIDEO_DURATION_MS;
        if (currentProgress < 1) {
          setProgress(currentProgress);
          if (videoType === "desktop") {
            drawFrame(frame, currentProgress, stats);
          } else {
            drawVerticalFrame(frame, currentProgress, stats);
          }
          requestAnimationFrame(animate);
        } else {
          setProgress(1);
          mediaRecorder.stop();
        }
      };

      animate();
    } catch (error) {
      console.error("Error generating video:", error);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;
    const extension = pickFileExtension(videoBlob.type);
    const filename = buildVideoFilename(new Date(), extension);
    const url = window.URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setVideoBlob(null);
    setIsGenerating(false);
  };

  return {
    canvasRef,
    isGenerating,
    videoBlob,
    progress,
    videoType,
    setVideoType,
    generateVideo,
    handleDownload,
    reset,
  };
}
