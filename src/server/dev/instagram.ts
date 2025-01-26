import { type Session } from "next-auth";
import { spawn } from "child_process";
import fs from "fs";
import { createBackground } from "./createBackground";
import { v2 as cloudinary } from "cloudinary";
import { createStoryWithVideo, createPollStory } from "./createStoryTemplates";

interface InstagramContainerResponse {
  id: string;
}

interface InstagramStatusResponse {
  status_code: string;
}

interface InstagramPublishResponse {
  id: string;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function createReel(
  inputPath: string,
  outputPath: string,
  number: number,
  season: string,
  player: string,
): Promise<boolean> {
  try {
    const backgroundPath = await createBackground(
      number,
      season,
      player,
      "reel",
    );

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        inputPath,
        "-i",
        backgroundPath ?? "",
        "-filter_complex",
        [
          // Scale video to 1080 width while maintaining aspect ratio
          "[0:v]scale=1080:608:force_original_aspect_ratio=decrease[scaled]",
          // Pad if necessary to ensure exact dimensions
          "[scaled]pad=1080:608:(ow-iw)/2:(oh-ih)/2[video]",
          // Overlay video at y=656 (positioned about 1/3 from the top in a 1920px height)
          "[1:v][video]overlay=0:700",
        ].join(";"),
        "-c:a",
        "aac",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        "-y",
        outputPath,
      ]);

      ffmpeg.on("close", (code) => {
        void (async () => {
          try {
            // Clean up background image
            if (backgroundPath) {
              await fs.promises.unlink(backgroundPath);
            }

            if (code === 0) {
              resolve(true);
            } else {
              reject(new Error(`FFmpeg process exited with code ${code}`));
            }
          } catch (error) {
            reject(
              new Error(
                error instanceof Error ? error.message : "Unknown error",
              ),
            );
          }
        })();
      });

      ffmpeg.stderr.on("data", (data) => {
        console.log(`FFmpeg: ${data}`);
      });
    });
  } catch (error) {
    console.error("Error creating reel:", error);
    return false;
  }
}

async function createCoverImage(
  number: number,
  season: string,
  player: string,
) {
  const backgroundPath = await createBackground(
    number,
    season,
    player,
    "thumbnail",
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
) {
  try {
    // Create cover image
    const coverImagePath = await createCoverImage(number, season, player);

    // Download the original video
    const tempInputPath = `/tmp/input_${Date.now()}.mp4`;
    const tempOutputPath = `/tmp/reel_${Date.now()}.mp4`;

    // Download the video
    const response = await fetch(videoUrl);
    const buffer = await response.arrayBuffer();
    await fs.promises.writeFile(tempInputPath, Buffer.from(buffer));

    // Create the reel with background
    await createReel(tempInputPath, tempOutputPath, number, season, player);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(tempOutputPath, {
      resource_type: "video",
      folder: "reels",
      public_id: `reel_${Date.now()}`,
    });

    // Clean up temporary files
    await fs.promises.unlink(tempInputPath);
    await fs.promises.unlink(tempOutputPath);

    // Upload to Instagram using the Cloudinary URL
    const result = await uploadToInstagramAPI(
      uploadResult.secure_url,
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
    // Upload cover image to Cloudinary if it exists
    let coverUrl = "";
    if (coverImagePath) {
      const coverUploadResult = await cloudinary.uploader.upload(
        coverImagePath,
        {
          resource_type: "image",
          folder: "covers",
        },
      );
      coverUrl = coverUploadResult.secure_url;
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
      if (["FINISHED", "PUBLISHED"].includes(status)) break;
      if (status === "ERROR") throw new Error("Container processing failed");
      if (status === "EXPIRED") throw new Error("Container expired");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }

    if (!["FINISHED", "PUBLISHED"].includes(status ?? "")) {
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

    return {
      id: publishData.id,
      url: `https://www.instagram.com/reel/${publishData.id}/`,
    };
  } catch (error) {
    console.error("Instagram API Error:", error);
    throw error;
  }
}

async function preprocessVideo(
  inputPath: string,
  outputPath: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-strict",
      "experimental",
      "-b:a",
      "128k",
      "-ar",
      "44100",
      "-pix_fmt",
      "yuv420p", // Required for Instagram
      "-movflags",
      "+faststart",
      "-y",
      outputPath,
    ]);

    ffmpeg.stderr.on("data", (data) => {
      console.log(`FFmpeg preprocessing: ${data}`);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg preprocessing failed with code ${code}`));
      }
    });
  });
}

export async function createInstagramStories(
  videoInput: string | File,
  pauseTime: number,
  _totalWedgies: number,
  _daysWithoutWedgie: number,
  _session: Session,
) {
  const createdFiles: string[] = [];

  try {
    // Create temporary files
    const tempInputPath = `/tmp/input_${Date.now()}.mp4`;
    const trimmedVideoPath = `/tmp/trimmed_${Date.now()}.mp4`;
    const stillFramePath = `/tmp/frame_${Date.now()}.png`;
    const story1Path = `/tmp/story1_${Date.now()}.mp4`;
    const story2Path = `/tmp/story2_${Date.now()}.png`;

    // Handle video input
    if (typeof videoInput === "string") {
      const response = await fetch(videoInput);
      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(tempInputPath, Buffer.from(buffer));
    } else {
      const buffer = await videoInput.arrayBuffer();
      await fs.promises.writeFile(tempInputPath, Buffer.from(buffer));
    }
    createdFiles.push(tempInputPath);

    // Create trimmed video
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempInputPath,
        "-t",
        pauseTime.toString(),
        "-c",
        "copy",
        trimmedVideoPath,
      ]);

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          createdFiles.push(trimmedVideoPath);
          resolve(true);
        } else {
          reject(new Error(`FFmpeg exited with ${code}`));
        }
      });
    });

    // Create still frame
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempInputPath,
        "-ss",
        pauseTime.toString(),
        "-vframes",
        "1",
        stillFramePath,
      ]);

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          createdFiles.push(stillFramePath);
          resolve(true);
        } else {
          reject(new Error(`FFmpeg exited with ${code}`));
        }
      });
    });

    // Create story 1 with template
    await createStoryWithVideo(trimmedVideoPath, story1Path);
    createdFiles.push(story1Path);

    // Create story 2 with template
    await createPollStory(stillFramePath, story2Path);
    createdFiles.push(story2Path);

    // Preprocess story1 for Instagram
    const processedStory1Path = `/tmp/processed_story1_${Date.now()}.mp4`;
    await preprocessVideo(story1Path, processedStory1Path);
    createdFiles.push(processedStory1Path);

    // Upload to Cloudinary
    const story1Upload = await cloudinary.uploader.upload(processedStory1Path, {
      resource_type: "video",
      folder: "stories",
    });
    const story2Upload = await cloudinary.uploader.upload(story2Path, {
      resource_type: "image",
      folder: "stories",
    });

    // Clean up files
    await Promise.all(createdFiles.map((file) => fs.promises.unlink(file)));

    return {
      success: true,
      stories: {
        story1: story1Upload.secure_url,
        story2: story2Upload.secure_url,
      },
    };
  } catch (error) {
    // Clean up on error
    await Promise.all(
      createdFiles.map((file) =>
        fs.promises
          .unlink(file)
          .catch((err) => console.error(`Failed to delete ${file}:`, err)),
      ),
    );

    console.error("Error creating Instagram stories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function uploadStoriesToInstagram(
  stories: {
    story1: string;
    story2: string;
    story3?: string;
  },
  instagramToken: string,
  _totalWedgies: number,
  _daysWithoutWedgie: number,
) {
  try {
    const results = [];
    const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    // Upload Story 1 (video)
    const story1Result = await fetch(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/stories`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${instagramToken}`,
        },
        body: new URLSearchParams({
          media_type: "VIDEO",
          video_url: stories.story1,
          access_token: instagramToken,
        }),
      },
    );
    results.push(await story1Result.json());

    // Upload Story 2 with poll
    const story2Result = await fetch(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/stories`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${instagramToken}`,
        },
        body: new URLSearchParams({
          media_type: "IMAGE",
          image_url: stories.story2,
          interactive_params: JSON.stringify({
            poll_params: {
              question: "Wedgie or Not?",
              options: ["Wedgie!", "Not a wedgie"],
            },
          }),
          access_token: instagramToken,
        }),
      },
    );
    results.push(await story2Result.json());

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Error uploading to Instagram:", error);
    throw error;
  }
}
