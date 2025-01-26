/* eslint-disable */

import { spawn } from "child_process";

export async function createStoryWithVideo(
  videoPath: string,
  outputPath: string,
  templatePath: string = "public/templates/story1.png",
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // First, get video duration using ffprobe
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ]);

    let duration = "";
    ffprobe.stdout.on("data", (data) => {
      duration += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("Failed to get video duration"));
        return;
      }

      const videoDuration = parseFloat(duration);
      const targetDuration = 10; // Target duration in seconds
      const pauseDuration = 1; // Pause duration in seconds

      // Calculate how many times we need to loop the video
      const numLoops = Math.ceil(
        targetDuration / (videoDuration + pauseDuration),
      );

      // Create the complex filter for looping
      const loopFilters = [];
      for (let i = 0; i < numLoops; i++) {
        // Scale and pad each instance of the video
        loopFilters.push(
          `[0:v]scale=2160:1216:force_original_aspect_ratio=decrease[scaled${i}]`,
          `[scaled${i}]pad=2160:1216:(ow-iw)/2:(oh-ih)/2[video${i}]`,
        );

        if (i > 0) {
          // Add 1 second black frame between loops
          loopFilters.push(`color=c=black:s=2160x1216:d=1[black${i}]`);
        }
      }

      // Create the concat string
      const concatParts = [];
      for (let i = 0; i < numLoops; i++) {
        concatParts.push(`[video${i}]`);
        if (i < numLoops - 1) {
          concatParts.push(`[black${i + 1}]`);
        }
      }
      loopFilters.push(
        `${concatParts.join("")}concat=n=${concatParts.length}:v=1:a=0[looped]`,
        `[1:v][looped]overlay=0:1400`,
      );

      const ffmpeg = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-i",
        templatePath ?? "",
        "-filter_complex",
        loopFilters.join(";"),
        "-t",
        "10", // Limit to 10 seconds
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-y",
        outputPath,
      ]);

      ffmpeg.stderr.on("data", (data) => {
        console.log(`FFmpeg: ${data}`);
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });
    });
  });
}

export async function createPollStory(
  imagePath: string,
  outputPath: string,
  templatePath: string = "public/templates/story2.png",
): Promise<boolean> {
  // Use the same dimensions and positioning as createStoryWithVideo
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      imagePath,
      "-i",
      templatePath,
      "-filter_complex",
      [
        "[0:v]scale=2160:1216:force_original_aspect_ratio=decrease[scaled]",
        "[scaled]pad=2160:1216:(ow-iw)/2:(oh-ih)/2[img]",
        "[1:v][img]overlay=0:1400",
      ].join(";"),
      "-y",
      outputPath,
    ]);

    ffmpeg.stderr.on("data", (data) => {
      console.log(`FFmpeg: ${data}`);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}
