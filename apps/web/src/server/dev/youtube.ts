import { google } from "googleapis";
import path from "path";
import * as fs from "fs";
import { type Session } from "next-auth";
import { createCanvas, loadImage } from "canvas";
import { createBackground } from "./createBackground";
import { composeWithWaveBand } from "./waveBand";

// Use the OAuth2 client type that google.auth.OAuth2 actually produces, which
// is the same one google.youtube() expects. The googleapis `Auth` namespace
// resolves to a different google-auth-library copy (googleapis bundles 10.7.0
// while googleapis-common uses 10.5.0), so annotating with Auth.OAuth2Client
// would clash with the runtime instances.
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export async function createShort(
  inputPath: string,
  outputPath: string,
  number: number,
  season: string,
  player: string,
  date: string | null,
): Promise<boolean> {
  try {
    const backgroundPath = await createBackground(
      number,
      season,
      player,
      "short",
      date,
    );

    try {
      await composeWithWaveBand({
        type: "short",
        data: { number, season, player, date },
        inputPath,
        backgroundPath,
        outputPath,
      });
      return true;
    } finally {
      await fs.promises.unlink(backgroundPath).catch(console.error);
    }
  } catch (error) {
    console.error("Error creating short:", error);
    return false;
  }
}

/**
 * The Short's cover, as a JPEG for YouTube's thumbnail upload: the same
 * "thumbnail" art as the Reel's cover (wave, big number, name, date), at
 * 1080x1920 so it stays under YouTube's 2 MB limit. The caller deletes the
 * file. Without it YouTube picks a frame from the clip.
 */
export async function createShortCover(
  number: number,
  season: string,
  player: string,
  date: string | null,
): Promise<string> {
  const backgroundPath = await createBackground(
    number,
    season,
    player,
    "thumbnail",
    date,
  );
  try {
    const art = await loadImage(backgroundPath);
    const canvas = createCanvas(1080, 1920);
    canvas.getContext("2d").drawImage(art, 0, 0, 1080, 1920);
    const coverPath = `/tmp/short_cover_${Date.now()}.jpg`;
    await fs.promises.writeFile(
      coverPath,
      canvas.toBuffer("image/jpeg", { quality: 0.9 }),
    );
    return coverPath;
  } finally {
    await fs.promises.unlink(backgroundPath).catch(console.error);
  }
}

/**
 * Sets a video's thumbnail. The channel needs custom thumbnails enabled
 * (a verified channel); YouTube then shows it in the Shorts grid too.
 */
export async function setVideoThumbnail(
  auth: OAuth2Client,
  videoId: string,
  imagePath: string,
) {
  const youtube = google.youtube({ version: "v3", auth });
  await youtube.thumbnails.set({
    videoId,
    media: {
      mimeType: "image/jpeg",
      body: fs.createReadStream(imagePath),
    },
  });
}

async function uploadVideo(
  videoPath: string,
  title: string,
  description: string,
  tags: string[],
  oauth2Client: OAuth2Client,
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
        privacyStatus: "public",
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
  oauth2Client: OAuth2Client,
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
  date: string | null = null,
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
    await createShort(videoPath, shortPath, number, season, player, date);

    console.log("user session", session?.user);

    // Upload both videos
    const [shortResult, originalResult] = await Promise.all([
      uploadVideo(shortPath, title, description, tags, oauth2Client, true),
      uploadVideo(videoPath, title, description, tags, oauth2Client, false),
    ]);

    // Clean up the temporary Short video
    await fs.promises.unlink(shortPath);

    // The cover, so the Short doesn't show a frame of the clip in the grid.
    // A failure here leaves the upload as it is.
    if (shortResult.videoId) {
      const coverPath = await createShortCover(number, season, player, date);
      try {
        await setVideoThumbnail(oauth2Client, shortResult.videoId, coverPath);
      } catch (error) {
        console.error("Error setting the Short's cover:", error);
      } finally {
        await fs.promises.unlink(coverPath).catch(console.error);
      }
    }

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
            date,
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
