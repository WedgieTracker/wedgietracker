import { type Session } from "next-auth";
import fs from "fs";
import { createBackground } from "./createBackground";
import { uploadFile } from "~/server/services/r2";
import { composeWithWaveBand } from "./waveBand";

interface InstagramContainerResponse {
  id: string;
}

interface InstagramStatusResponse {
  status_code: string;
}

interface InstagramPublishResponse {
  id: string;
}

const READY_STATES = new Set(["FINISHED", "PUBLISHED"]);

export async function createReel(
  inputPath: string,
  outputPath: string,
  number: number,
  season: string,
  player: string,
  date: string | null = null,
): Promise<boolean> {
  try {
    const backgroundPath = await createBackground(
      number,
      season,
      player,
      "reel",
      date,
    );

    try {
      await composeWithWaveBand({
        type: "reel",
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
    console.error("Error creating reel:", error);
    return false;
  }
}

async function createCoverImage(
  number: number,
  season: string,
  player: string,
  date: string | null,
) {
  const backgroundPath = await createBackground(
    number,
    season,
    player,
    "thumbnail",
    date,
  );
  return backgroundPath;
}

export async function uploadToInstagram(
  videoUrl: string,
  title: string,
  description: string,
  session: Session,
  number: number,
  season: string,
  player: string,
  instagramToken: string,
  date: string | null = null,
) {
  try {
    // Create cover image
    const coverImagePath = await createCoverImage(number, season, player, date);

    // Download the original video
    const tempInputPath = `/tmp/input_${Date.now()}.mp4`;
    const tempOutputPath = `/tmp/reel_${Date.now()}.mp4`;

    // Download the video
    const response = await fetch(videoUrl);
    const buffer = await response.arrayBuffer();
    await fs.promises.writeFile(tempInputPath, Buffer.from(buffer));

    // Create the reel with background
    await createReel(
      tempInputPath,
      tempOutputPath,
      number,
      season,
      player,
      date,
    );

    // Upload so Instagram can fetch the reel from a public URL
    const reelUrl = await uploadFile(
      tempOutputPath,
      `reels/reel_${Date.now()}.mp4`,
      "video/mp4",
    );

    // Clean up temporary files
    await fs.promises.unlink(tempInputPath);
    await fs.promises.unlink(tempOutputPath);

    // Upload to Instagram using the public reel URL
    const result = await uploadToInstagramAPI(
      reelUrl,
      description,
      instagramToken,
      coverImagePath,
    );

    // Clean up cover image
    if (coverImagePath) {
      await fs.promises.unlink(coverImagePath);
    }

    return {
      success: true,
      reel: {
        id: result.id,
        url: result.url,
      },
    };
  } catch (error) {
    console.error("Error uploading to Instagram:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// This function needs to be implemented using Instagram Graph API
async function uploadToInstagramAPI(
  videoUrl: string,
  description: string,
  instagramToken: string,
  coverImagePath?: string,
) {
  const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const ACCESS_TOKEN = instagramToken;

  if (!IG_USER_ID || !ACCESS_TOKEN) {
    throw new Error("Missing Instagram credentials");
  }

  try {
    // Upload the cover image too, if there is one
    let coverUrl = "";
    if (coverImagePath) {
      coverUrl = await uploadFile(
        coverImagePath,
        `covers/cover_${Date.now()}.jpg`,
        "image/jpeg",
      );
    }

    // Create container for the reel with user tag
    const containerResponse = await fetch(
      `https://graph.instagram.com/v21.0/${IG_USER_ID}/media`,
      {
        method: "POST",
        body: new URLSearchParams({
          media_type: "REELS",
          video_url: videoUrl,
          caption: `${description}`,
          cover_url: coverUrl,
          user_tags: JSON.stringify([
            {
              username: "nodunksinc",
            },
          ]),
          access_token: ACCESS_TOKEN,
        }),
      },
    );

    const responseText = await containerResponse.text();
    console.log("Raw response:", responseText);

    let containerData: InstagramContainerResponse;
    try {
      containerData = JSON.parse(responseText) as InstagramContainerResponse;
    } catch (error) {
      throw new Error(
        `Failed to parse response as JSON. Raw response: ${responseText} ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!containerResponse.ok) {
      throw new Error(
        `API error (${containerResponse.status}): ${JSON.stringify(containerData)}`,
      );
    }

    if (!containerData.id) {
      throw new Error("Failed to create media container - no ID returned");
    }

    // Poll for status until ready
    const checkStatus = async (): Promise<string> => {
      const statusResponse = await fetch(
        `https://graph.instagram.com/v21.0/${containerData.id}?fields=status_code&access_token=${ACCESS_TOKEN}`,
      );
      const statusData =
        (await statusResponse.json()) as InstagramStatusResponse;
      return statusData.status_code;
    };

    // Wait for container to be ready
    let status;
    for (let i = 0; i < 5; i++) {
      status = await checkStatus();
      if (READY_STATES.has(status)) break;
      if (status === "ERROR") throw new Error("Container processing failed");
      if (status === "EXPIRED") throw new Error("Container expired");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }

    if (!READY_STATES.has(status ?? "")) {
      throw new Error(`Container processing timeout. Last status: ${status}`);
    }

    // Publish the container
    const publishResponse = await fetch(
      `https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish`,
      {
        method: "POST",
        body: new URLSearchParams({
          creation_id: containerData.id,
          access_token: ACCESS_TOKEN,
        }),
      },
    );

    const publishData =
      (await publishResponse.json()) as InstagramPublishResponse;
    if (!publishResponse.ok || !publishData.id) {
      throw new Error(`Failed to publish: ${JSON.stringify(publishData)}`);
    }

    // The publish call returns the media id, not the short code a reel URL
    // needs, so ask for the permalink. Without one, link the profile.
    let url = "https://www.instagram.com/wedgie.tracker/";
    try {
      const linkResponse = await fetch(
        `https://graph.instagram.com/v21.0/${publishData.id}?fields=permalink&access_token=${ACCESS_TOKEN}`,
      );
      const linkData = (await linkResponse.json()) as { permalink?: string };
      if (linkResponse.ok && linkData.permalink) url = linkData.permalink;
    } catch (error) {
      console.error("Instagram permalink lookup failed:", error);
    }

    return { id: publishData.id, url };
  } catch (error) {
    console.error("Instagram API Error:", error);
    throw error;
  }
}
