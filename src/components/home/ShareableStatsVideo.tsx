import { useState, useRef } from "react";
import { Loader } from "../loader";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  MonitorDown,
  RectangleVertical,
  RectangleHorizontal,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface ShareableStatsVideoProps {
  stats: {
    totalWedgies: number;
    currentPace: number;
    lastWedgie: Date | null;
    liveGames: boolean;
  };
}

interface WaveLayer {
  speedMultiplier: number;
  yOffset: number;
  opacity: number;
  phase: number;
}

export function ShareableStatsVideo({ stats }: ShareableStatsVideoProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoType, setVideoType] = useState<"desktop" | "mobile">("desktop");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null); // Ref to store the logo image

  // Initialize wave layers with increased yOffset for better visibility
  const waveLayers: WaveLayer[] = [
    { speedMultiplier: 0.25, yOffset: -15, opacity: 0.3, phase: 0 },
    { speedMultiplier: 0.3, yOffset: -10, opacity: 0.5, phase: Math.PI / 2 },
    { speedMultiplier: 0.35, yOffset: 10, opacity: 0.7, phase: Math.PI },
    {
      speedMultiplier: 0.4,
      yOffset: 0,
      opacity: 1.0,
      phase: (3 * Math.PI) / 2,
    },
  ];

  /**
   * Helper function to load an image.
   * @param url - The URL of the image to load.
   * @returns A promise that resolves to the loaded HTMLImageElement.
   */
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
  };

  /**
   * Draws a single wave layer on the canvas.
   * @param ctx - The canvas rendering context.
   * @param layer - The wave layer configuration.
   * @param waveLength - The wavelength of the wave.
   * @param baseY - The base Y position for the wave.
   */
  const drawWaveLayer = (
    ctx: CanvasRenderingContext2D,
    layer: WaveLayer,
    waveLength: number,
    baseY: number,
  ) => {
    // Update the phase for animation
    layer.phase += layer.speedMultiplier * 0.02; // Adjust frameSpeed here if needed
    if (layer.phase > 2 * Math.PI) {
      layer.phase -= 2 * Math.PI;
    }

    // Draw two waves per layer for seamless looping
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(0, canvasRef.current!.height); // Start from bottom-left

      for (let x = 0; x <= canvasRef.current!.width + 10; x += 10) {
        const dx = (x / waveLength) * 2 * Math.PI + layer.phase + i * Math.PI;
        const yOffsetCalculated = Math.sin(dx) * 40; // Wave amplitude
        ctx.lineTo(x, baseY + layer.yOffset + yOffsetCalculated);
      }

      ctx.lineTo(canvasRef.current!.width, canvasRef.current!.height); // Bottom-right
      ctx.lineTo(0, canvasRef.current!.height); // Back to bottom-left
      ctx.closePath();

      ctx.fillStyle = `rgba(255, 0, 255, ${layer.opacity})`; // Pink with variable opacity
      ctx.fill();
    }
  };

  /**
   * Draws the current frame on the canvas.
   * @param ctx - The canvas rendering context.
   * @param progress - The progress of the video generation (0 to 1).
   * @param stats - The stats data.
   */
  const drawFrame = (
    ctx: CanvasRenderingContext2D,
    progress: number,
    stats: ShareableStatsVideoProps["stats"],
  ) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Animate numbers from 0 to target (complete in ~1 second)
    const numberAnimationProgress = Math.min(progress * 20, 1);
    const currentTotalWedgies = Math.round(
      stats.totalWedgies * numberAnimationProgress,
    );
    const currentPaceValue = Math.round(
      stats.currentPace * numberAnimationProgress,
    );

    // Calculate fill percentage and animate it (complete in 2 seconds)
    const fillPercentage = Math.min((stats.totalWedgies / 50) * 100, 100);
    const currentFillPercentage = Math.min(
      fillPercentage,
      ((progress * 20) / 2) * 100,
    );

    // Clear canvas with dark purple background
    ctx.fillStyle = "rgb(23,0,43)"; // darkpurple
    ctx.fillRect(0, 0, width, height);

    // Calculate wave height based on fill percentage
    const maxHeight = height * 0.9; // Maximum height the wave can reach
    const currentHeight = (currentFillPercentage / 100) * maxHeight;
    const baseY = height - currentHeight;

    // Draw each wave layer
    waveLayers.forEach((layer) => {
      drawWaveLayer(ctx, layer, width * 0.4, baseY);
    });

    // Stats container dimensions
    const statsWidth = width * 0.3;
    const statsHeight = height * 0.4;
    const statsX = (width - statsWidth) / 2;
    const statsY = (height - statsHeight) / 2 + 60;

    // Add semi-transparent background for stats with rounded corners
    ctx.fillStyle = "rgba(31, 0, 77, 0.5)";
    ctx.beginPath();
    ctx.roundRect(statsX, statsY, statsWidth, statsHeight, 20);
    ctx.fill();

    // Draw "WE'RE AT" text
    ctx.font = "700 32px Inter";
    ctx.fillStyle = "#EAFF00"; // Yellow
    ctx.textAlign = "center";
    ctx.fillText("WE'RE AT", width / 2, statsY + 60);

    // Draw total wedgies number (animated)
    ctx.font = "900 280px Inter";
    ctx.fillStyle = "#EAFF00"; // Yellow
    ctx.textAlign = "center";
    ctx.fillText(
      currentTotalWedgies.toString(),
      width / 2,
      statsY + statsHeight / 2 + 85,
    );

    // Draw "WEDGIES" text
    ctx.font = "900 75px Inter";
    ctx.fillText("WEDGIES", width / 2, statsY + statsHeight - 35);

    // Add rounded rectangles for bottom stats
    const statBoxWidth = width * 0.15;
    const statBoxHeight = 200;
    const leftStatX = width * 0.25 - statBoxWidth / 2;
    const rightStatX = width * 0.75 - statBoxWidth / 2;

    // Bottom stats section
    const bottomY = (height - statsHeight) / 2 + 180;

    // Background boxes for stats
    ctx.fillStyle = "rgba(31, 0, 77, 0.5)";
    ctx.beginPath();
    ctx.roundRect(leftStatX, bottomY, statBoxWidth, statBoxHeight, 20);
    ctx.roundRect(rightStatX, bottomY, statBoxWidth, statBoxHeight, 20);
    ctx.fill();

    // Draw Pace (left side) - animated number
    ctx.font = "900 60px Inter";
    ctx.fillStyle = "#FF00FF"; // Pink
    ctx.textAlign = "center";
    ctx.fillText("PACE", width * 0.25, bottomY + 180);
    ctx.font = "900 120px Inter";
    ctx.fillStyle = "#EAFF00"; // Yellow
    ctx.fillText(currentPaceValue.toString(), width * 0.25, bottomY + 120);

    // Draw days without wedgies or new wedgie (right side)
    const daysWithoutWedgie = stats.lastWedgie
      ? Math.ceil(
          (new Date().getTime() - new Date(stats.lastWedgie).getTime()) /
            (1000 * 60 * 60 * 24),
        ) - 1
      : 0;
    const hasNewWedgie = stats.lastWedgie
      ? (new Date().getTime() - new Date(stats.lastWedgie).getTime()) /
          (1000 * 60 * 60 * 24) <
        1
      : false;

    if (hasNewWedgie) {
      ctx.font = "900 64px Inter";
      ctx.fillStyle = "#FF00FF"; // Pink
      ctx.fillText("NEW", width * 0.75, bottomY + 110);
      ctx.font = "900 50px Inter";
      ctx.fillStyle = "#EAFF00"; // Yellow
      ctx.fillText("WEDGIE", width * 0.75, bottomY + 150);
    } else {
      ctx.font = "900 120px Inter";
      ctx.fillStyle = "#EAFF00"; // Yellow
      ctx.fillText(daysWithoutWedgie.toString(), width * 0.75, bottomY + 116);
      ctx.font = "700 28px Inter";
      ctx.fillStyle = "#FF00FF"; // Pink
      ctx.fillText("DAYS WITHOUT", width * 0.75, bottomY + 152);
      ctx.fillText("WEDGIES", width * 0.75, bottomY + 182);
    }

    // Draw Logo with Dark Purple Background
    if (imageRef.current) {
      const logoWidth = 300; // Adjust logo width as needed
      const logoHeight = 100; // Adjust logo height as needed
      const logoX = width / 2 - logoWidth / 2; // Center horizontally
      const logoY = 0 + 150; // Position vertically as needed

      // Draw dark purple background
      ctx.fillStyle = "rgb(23,0,43)"; // darkpurple
      ctx.fillRect(logoX - 60, logoY - 60, logoWidth + 120, logoHeight + 120); // Adding padding

      // Draw the logo image
      ctx.drawImage(imageRef.current, logoX, logoY, logoWidth, logoHeight);
    }

    // Add button-like background for URL
    const urlText = "WEDGIETRACKER.COM";
    ctx.font = "700 24px Inter";
    const textMetrics = ctx.measureText(urlText);
    const padding = 40;
    const buttonWidth = textMetrics.width + padding * 2;
    const buttonHeight = 50;
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height - 159;

    // Draw rounded rectangle border
    ctx.strokeStyle = "rgb(23,0,43)"; // Dark Purple
    ctx.lineWidth = 2; // Border width
    ctx.beginPath();
    ctx.roundRect(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      buttonHeight / 2,
    );
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "rgb(23,0,43)"; // Dark Purple
    ctx.textAlign = "center";
    ctx.fillText(urlText, width / 2, height - 125);
  };

  const drawVerticalFrame = (
    ctx: CanvasRenderingContext2D,
    progress: number,
    stats: ShareableStatsVideoProps["stats"],
  ) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Animate numbers from 0 to target (complete in ~1 second)
    const numberAnimationProgress = Math.min(progress * 20, 1);
    const currentTotalWedgies = Math.round(
      stats.totalWedgies * numberAnimationProgress,
    );
    const currentPaceValue = Math.round(
      stats.currentPace * numberAnimationProgress,
    );

    // Calculate fill percentage and animate it (complete in 2 seconds)
    const fillPercentage = Math.min((stats.totalWedgies / 50) * 100, 100);
    const currentFillPercentage = Math.min(
      fillPercentage,
      ((progress * 20) / 2) * 100,
    );

    // Clear canvas with dark purple background
    ctx.fillStyle = "rgb(23,0,43)"; // darkpurple
    ctx.fillRect(0, 0, width, height);

    // Calculate wave height based on fill percentage
    const maxHeight = height * 0.9; // Maximum height the wave can reach
    const currentHeight = (currentFillPercentage / 100) * maxHeight;
    const baseY = height - currentHeight;

    // Draw each wave layer
    waveLayers.forEach((layer) => {
      drawWaveLayer(ctx, layer, width * 0.4, baseY);
    });

    // Stats container dimensions
    const statsWidth = width * 0.65;
    const statsHeight = height * 0.3;
    const statsX = (width - statsWidth) / 2;
    const statsY = (height - statsHeight) / 2 - 150;

    // Add semi-transparent background for stats with rounded corners
    ctx.fillStyle = "rgba(31, 0, 77, 0.5)";
    ctx.beginPath();
    ctx.roundRect(statsX, statsY, statsWidth, statsHeight, 20);
    ctx.fill();

    // Draw "WE'RE AT" text
    ctx.font = "700 32px Inter";
    ctx.fillStyle = "#EAFF00"; // Yellow
    ctx.textAlign = "center";
    ctx.fillText("WE'RE AT", width / 2, statsY + 85);

    // Draw total wedgies number (animated)
    ctx.font = "900 380px Inter";
    ctx.fillStyle = "#EAFF00"; // Yellow
    ctx.textAlign = "center";
    ctx.fillText(
      currentTotalWedgies.toString(),
      width / 2,
      statsY + statsHeight / 2 + 125,
    );

    // Draw "WEDGIES" text
    ctx.font = "900 75px Inter";
    ctx.fillText("WEDGIES", width / 2, statsY + statsHeight - 55);

    // Add rounded rectangles for bottom stats
    const statBoxWidth = width * 0.3;
    const statBoxHeight = 250;
    const leftStatX = width * 0.68 - statBoxWidth / 2;
    const rightStatX = width * 0.32 - statBoxWidth / 2;

    // Bottom stats section
    const bottomY = (height - statsHeight) / 2 + 550;

    // Background boxes for stats
    ctx.fillStyle = "rgba(31, 0, 77, 0.5)";
    ctx.beginPath();
    ctx.roundRect(leftStatX, bottomY, statBoxWidth, statBoxHeight, 20);
    ctx.roundRect(rightStatX, bottomY, statBoxWidth, statBoxHeight, 20);
    ctx.fill();

    // Draw Pace (left side) - animated number
    ctx.font = "900 90px Inter";
    ctx.fillStyle = "#FF00FF"; // Pink
    ctx.textAlign = "center";
    ctx.fillText("PACE", width * 0.32, bottomY + 215);
    ctx.font = "900 165px Inter";
    ctx.fillStyle = "#EAFF00"; // Yellow
    ctx.fillText(currentPaceValue.toString(), width * 0.32, bottomY + 155);

    // Draw days without wedgies or new wedgie (right side)
    const daysWithoutWedgie = stats.lastWedgie
      ? Math.ceil(
          (new Date().getTime() - new Date(stats.lastWedgie).getTime()) /
            (1000 * 60 * 60 * 24),
        ) - 1
      : 0;
    const hasNewWedgie = stats.lastWedgie
      ? (new Date().getTime() - new Date(stats.lastWedgie).getTime()) /
          (1000 * 60 * 60 * 24) <
        1
      : false;

    if (hasNewWedgie) {
      ctx.font = "900 94px Inter";
      ctx.fillStyle = "#FF00FF"; // Pink
      ctx.fillText("NEW", width * 0.68, bottomY + 135);
      ctx.font = "900 60px Inter";
      ctx.fillStyle = "#EAFF00"; // Yellow
      ctx.fillText("WEDGIE", width * 0.68, bottomY + 195);
    } else {
      ctx.font = "900 140px Inter";
      ctx.fillStyle = "#EAFF00"; // Yellow
      ctx.fillText(daysWithoutWedgie.toString(), width * 0.68, bottomY + 140);
      ctx.font = "700 36px Inter";
      ctx.fillStyle = "#FF00FF"; // Pink
      ctx.fillText("DAYS WITHOUT", width * 0.685, bottomY + 185);
      ctx.fillText("WEDGIES", width * 0.685, bottomY + 225);
    }

    // Draw Logo with Dark Purple Background
    if (imageRef.current) {
      const logoWidth = 300; // Adjust logo width as needed
      const logoHeight = 100; // Adjust logo height as needed
      const logoX = width / 2 - logoWidth / 2; // Center horizontally
      const logoY = 0 + 210; // Position vertically as needed

      // Draw dark purple background
      ctx.fillStyle = "rgb(23,0,43)"; // darkpurple
      ctx.fillRect(logoX - 60, logoY - 60, logoWidth + 120, logoHeight + 180); // Adding padding

      // Draw the logo image
      ctx.drawImage(imageRef.current, logoX, logoY, logoWidth, logoHeight);
    }

    // Add button-like background for URL
    const urlText = "WEDGIETRACKER.COM";
    ctx.font = "700 24px Inter";
    const textMetrics = ctx.measureText(urlText);
    const padding = 40;
    const buttonWidth = textMetrics.width + padding * 2;
    const buttonHeight = 50;
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height - 259;

    // Draw rounded rectangle border
    ctx.strokeStyle = "rgb(23,0,43)"; // Dark Purple
    ctx.lineWidth = 2; // Border width
    ctx.beginPath();
    ctx.roundRect(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      buttonHeight / 2,
    );
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "rgb(23,0,43)"; // Dark Purple
    ctx.textAlign = "center";
    ctx.fillText(urlText, width / 2, height - 225);
  };

  /**
   * Generates the video by drawing frames onto the canvas.
   */
  const generateVideo = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (videoType === "desktop") {
        canvas.width = 1920;
        canvas.height = 1080;
      } else {
        canvas.width = 1080;
        canvas.height = 1920;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load the logo image
      const logoUrl =
        "https://res.cloudinary.com/wedgietracker/image/upload/v1737299676/assets/logo-wedgietracker_rlzejd.png";
      const logoImage = await loadImage(logoUrl);
      imageRef.current = logoImage;

      // Check supported MIME types
      const mimeTypes = [
        'video/mp4;codecs="avc1.424028, mp4a.40.2"',
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];

      const supportedMimeType = mimeTypes.find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType),
      );

      if (!supportedMimeType) {
        throw new Error("No supported media type found");
      }

      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: 8000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: supportedMimeType });
        setVideoBlob(blob);
        setIsGenerating(false);
      };

      mediaRecorder.start();

      const startTime = Date.now();
      const duration = 10000; // 10 seconds

      const animate = () => {
        const currentProgress = (Date.now() - startTime) / duration;
        if (currentProgress < 1) {
          setProgress(currentProgress);
          if (videoType === "desktop") {
            drawFrame(ctx, currentProgress, stats);
          } else {
            drawVerticalFrame(ctx, currentProgress, stats);
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

    const today = new Date();
    const dateString = today.toISOString().split("T")[0];
    const url = window.URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;

    // Determine file extension based on MIME type
    const extension = videoBlob.type.includes("webm") ? "webm" : "mp4";
    a.download = `WedgieTracker-${dateString}.${extension}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="absolute bottom-4 right-4 z-10 hidden h-10 w-10 rounded-full border-2 border-pink bg-pink p-2 text-center font-bold text-darkpurple opacity-30 transition-all duration-300 hover:bg-darkpurple hover:text-pink hover:opacity-100 md:block">
                <MonitorDown className="h-5 w-5" />
                <span className="sr-only">Share Stats Video</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate a video</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="border-darkpurple-lighter bg-darkpurple sm:max-w-[600px]">
        <DialogTitle className="sr-only">Share Stats Video</DialogTitle>
        <div className="flex flex-col items-center gap-4 p-6">
          <canvas ref={canvasRef} className="hidden" />

          {!videoBlob && (
            <>
              <button
                onClick={generateVideo}
                disabled={isGenerating}
                className="group flex w-full flex-row items-center justify-center gap-2 rounded-full border-2 border-yellow bg-yellow px-8 py-2 text-center text-xl font-bold uppercase text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "Generating Video..." : "Generate Video"}
                <span className="rounded-full border-2 border-darkpurple bg-darkpurple px-2 py-0.5 text-xs text-yellow transition-all duration-300 group-hover:bg-yellow group-hover:text-darkpurple">
                  Beta
                </span>
              </button>
              {!isGenerating && (
                <div className="flex w-full items-center justify-center gap-4 rounded-full border-2 border-pink p-2">
                  <button
                    onClick={() => setVideoType("desktop")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      videoType === "desktop"
                        ? "bg-pink text-darkpurple"
                        : "text-pink hover:bg-pink/10"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <RectangleHorizontal className="h-5 w-5" />
                      <span>Landscape (16:9)</span>
                      <span className="text-xs opacity-75">
                        YouTube • Twitter
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setVideoType("mobile")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      videoType === "mobile"
                        ? "bg-pink text-darkpurple"
                        : "text-pink hover:bg-pink/10"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <RectangleVertical className="h-5 w-5" />
                      <span>Portrait (9:16)</span>
                      <span className="text-xs opacity-75">
                        Instagram • TikTok
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          {isGenerating && (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="-mb-2 -mr-8 w-full max-w-24">
                  <Loader />
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-darkpurple-lighter">
                <div
                  className="absolute left-0 top-0 h-full bg-pink"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="text-center text-sm text-white/60">
                {Math.round(progress * 100)}%
              </div>
            </div>
          )}

          {videoBlob && (
            <div className="flex w-full flex-col items-center gap-4">
              <video
                src={URL.createObjectURL(videoBlob)}
                controls
                className={`w-full rounded-lg ${
                  videoType === "desktop" ? "aspect-video" : "max-h-[400px]"
                }`}
              />
              <div className="flex w-full flex-row gap-4">
                <button
                  onClick={() => {
                    setVideoBlob(null);
                    setIsGenerating(false);
                  }}
                  className="flex-1 rounded-full border-2 border-pink bg-transparent px-8 py-2 text-center font-bold uppercase tracking-wide text-pink transition-all duration-300 hover:bg-pink hover:text-darkpurple"
                >
                  Generate New
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 rounded-full border-2 border-yellow bg-yellow px-8 py-2 text-center font-black uppercase tracking-wide text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow"
                >
                  Download
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 text-center text-sm text-white/60">
            Generate a video of the current stats to share on social media.{" "}
            <br />
            If the result doesn&apos;t look good, try generating a new video.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
