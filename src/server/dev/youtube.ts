import { google } from "googleapis";
import type { Auth } from "googleapis";
import path from "path";
import * as fs from "fs";
import { type Session } from "next-auth";
import { spawn } from "child_process";
import { createBackground } from "./createBackground";

async function createShort(
  inputPath: string,
  outputPath: string,
  number: number,
  season: string,
  player: string,
): Promise<boolean> {
  try {
    const backgroundPath = await createBackground(number, season, player);

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        inputPath,
        "-i",
        backgroundPath ?? "",
        "-filter_complex",
        [
          // First scale the video to have a width of 2160 while maintaining aspect ratio
          "[0:v]scale=2160:1216:force_original_aspect_ratio=decrease[scaled]",
          // Then pad if necessary to ensure exact dimensions
          "[scaled]pad=2160:1216:(ow-iw)/2:(oh-ih)/2[video]",
          // Overlay video at y=1400
          "[1:v][video]overlay=0:1400",
        ].join(";"),
        "-c:a",
        "copy",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-y",
        outputPath,
      ]);

      ffmpeg.on("close", (code) => {
        void (async () => {
          // Clean up background image
          await fs.promises.unlink(backgroundPath ?? "").catch(console.error);

          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error(`FFmpeg process exited with code ${code}`));
          }
        })();
      });

      ffmpeg.stderr.on("data", (data) => {
        console.log(`FFmpeg: ${data}`);
      });
    });
  } catch (error) {
    console.error("Error creating short:", error);
    return false;
  }
}

async function uploadVideo(
  videoPath: string,
  title: string,
  description: string,
  tags: string[],
  oauth2Client: Auth.OAuth2Client,
  isShort = false,
) {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: isShort ? `${title} #Shorts` : title,
        description,
        tags,
        categoryId: "17",
      },
      status: {
        privacyStatus: "unlisted",
        madeForKids: false,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  return {
    success: true,
    videoId: res.data.id,
    videoUrl: `https://www.youtube.com/watch?v=${res.data.id}`,
  };
}

async function refreshAccessToken(
  oauth2Client: Auth.OAuth2Client,
  refreshToken: string,
): Promise<string | null> {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token ?? null;
    return accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Failed to refresh access token");
  }
}

export async function uploadToYoutube(
  videoPath: string,
  title: string,
  description: string,
  tags: string[] = [],
  session: Session,
  number: number,
  season: string,
  player: string,
): Promise<{
  success: boolean;
  short?: { videoId: string; videoUrl: string };
  original?: { videoId: string; videoUrl: string };
  error?: string;
}> {
  console.log("session", session);
  if (!session?.user?.accessToken || !session?.user?.refreshToken) {
    throw new Error("No authentication tokens found - please log in again");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
  );

  // Set initial credentials
  oauth2Client.setCredentials({
    access_token: session.user.accessToken,
    refresh_token: session.user.refreshToken,
    token_type: "Bearer",
  });

  try {
    // Test the credentials by making a simple API call
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });

    // Continue with video processing and upload
    const shortPath = `/tmp/short_${path.basename(videoPath)}`;

    // Convert the video to Short format
    await createShort(videoPath, shortPath, number, season, player);

    console.log("user session", session?.user);

    // Upload both videos
    const [shortResult, originalResult] = await Promise.all([
      uploadVideo(shortPath, title, description, tags, oauth2Client, true),
      uploadVideo(videoPath, title, description, tags, oauth2Client, false),
    ]);

    // Clean up the temporary Short video
    await fs.promises.unlink(shortPath);

    if (!shortResult.videoId || !originalResult.videoId) {
      throw new Error("Failed to upload videos to YouTube");
    }

    return {
      success: true,
      short: {
        videoId: shortResult.videoId,
        videoUrl: shortResult.videoUrl,
      },
      original: {
        videoId: originalResult.videoId,
        videoUrl: originalResult.videoUrl,
      },
    };
  } catch (error: unknown) {
    console.error("Error uploading to YouTube:", error);

    // Type guard to safely check error properties
    const isApiError = (
      err: unknown,
    ): err is { response?: { status?: number } } => {
      return typeof err === "object" && err !== null && "response" in err;
    };

    // Check if the error is due to an expired access token
    if (
      isApiError(error) &&
      error.response?.status === 401 &&
      session.user.refreshToken
    ) {
      try {
        const newAccessToken = await refreshAccessToken(
          oauth2Client,
          session.user.refreshToken,
        );
        if (newAccessToken) {
          // Update session with new access token
          // This step might require additional handling depending on your session management
          // For example, you might need to update the JWT token in NextAuth

          oauth2Client.setCredentials({
            access_token: newAccessToken,
            refresh_token: session.user.refreshToken,
            token_type: "Bearer",
          });

          // Retry the upload with the new access token
          return await uploadToYoutube(
            videoPath,
            title,
            description,
            tags,
            session,
            number,
            season,
            player,
          );
        }
      } catch (refreshError) {
        console.error("Failed to refresh access token:", refreshError);
        throw new Error("Session expired - please log in again");
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function processVideoForYoutube(
  inputPath: string,
  outputPath: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log("Starting FFmpeg process with:", {
      inputPath,
      outputPath,
      exists: fs.existsSync(inputPath),
    });

    // Use simpler FFmpeg settings first to test
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      inputPath,
      // Basic video settings without hardware acceleration
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      // Basic scaling
      "-vf",
      "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
      // Audio settings
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      // Output options
      "-y",
      outputPath,
    ]);

    // Capture and log FFmpeg output
    ffmpeg.stderr.on("data", (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.stdout.on("data", (data) => {
      console.log(`FFmpeg stdout: ${data}`);
    });

    ffmpeg.on("error", (error) => {
      console.error("FFmpeg spawn error:", error);
      reject(error);
    });

    ffmpeg.on("close", (code) => {
      console.log(`FFmpeg process closed with code ${code}`);
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}
