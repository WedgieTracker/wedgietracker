import crypto from "crypto";
import OAuth from "oauth-1.0a";
import { TWITTER_CONFIG } from "../dev/twitter-auth";

interface TwitterResponse {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    text: string;
  };
}

// Add interface definitions for Twitter API responses
interface TwitterMediaInitResponse {
  media_id_string: string;
}

interface TwitterProcessingInfo {
  state: "pending" | "in_progress" | "succeeded" | "failed";
  check_after_secs?: number;
  error?: {
    message: string;
  };
}

interface TwitterMediaStatusResponse {
  processing_info: TwitterProcessingInfo;
}

interface TwitterErrorResponse {
  errors?: Array<{ message: string }>;
}

const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

async function pollMediaProcessing(
  oauth: OAuth,
  token: OAuth.Token,
  mediaId: string,
  initialInfo: TwitterProcessingInfo,
) {
  let processingInfo = initialInfo;
  console.log("Processing state:", processingInfo.state);

  while (["pending", "in_progress"].includes(processingInfo.state)) {
    const waitTime = (processingInfo.check_after_secs ?? 1) * 1000;
    console.log(`Waiting ${waitTime}ms before checking status...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    const statusRequestData = {
      url: `${MEDIA_UPLOAD_URL}?command=STATUS&media_id=${mediaId}`,
      method: "GET",
    };
    const statusHeaders = oauth.toHeader(
      oauth.authorize(statusRequestData, token),
    );
    const statusResponse = await fetch(statusRequestData.url, {
      method: statusRequestData.method,
      headers: {
        ...statusHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const statusText = await statusResponse.text();
    console.log("STATUS response:", statusText);
    const statusData = JSON.parse(statusText) as TwitterMediaStatusResponse;

    if (!statusData.processing_info) {
      console.log("Processing complete (no processing_info)");
      return;
    }

    processingInfo = statusData.processing_info;
    console.log("Processing state:", processingInfo.state);

    if (processingInfo.state === "failed") {
      throw new Error(
        `Video processing failed: ${processingInfo.error?.message ?? "Unknown error"}`,
      );
    }
  }
}

async function uploadVideoToTwitter(
  oauth: OAuth,
  token: OAuth.Token,
  videoUrl: string,
): Promise<string> {
  console.log("Uploading video to Twitter...");
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) throw new Error("Failed to fetch video");

  const buffer = await videoResponse.arrayBuffer();
  const file = Buffer.from(buffer);
  const total_bytes = file.length;
  const base64EncodedFile = file.toString("base64");
  console.log(
    `Video size: ${total_bytes} bytes (${(total_bytes / 1024 / 1024).toFixed(2)} MB)`,
  );

  // INIT phase
  console.log("Starting INIT phase...");
  const initRequestData = {
    url: MEDIA_UPLOAD_URL,
    method: "POST",
    data: {
      command: "INIT",
      total_bytes: total_bytes.toString(),
      media_type: "video/mp4",
      media_category: "tweet_video",
    },
  };
  const initHeaders = oauth.toHeader(oauth.authorize(initRequestData, token));
  console.log("Sending INIT request...");
  const initResponse = await fetch(initRequestData.url, {
    method: initRequestData.method,
    headers: {
      ...initHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(initRequestData.data),
  });
  const initData = (await initResponse.json()) as TwitterMediaInitResponse;
  const mediaId = initData.media_id_string;

  // APPEND phase
  console.log("Starting APPEND phase...");
  const chunkSize = 5 * 1024 * 1024;
  const chunks =
    base64EncodedFile.match(new RegExp(`.{1,${chunkSize}}`, "g")) ?? [];
  console.log(`Uploading ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Uploading chunk ${i + 1}/${chunks.length}`);
    const appendRequestData = {
      url: MEDIA_UPLOAD_URL,
      method: "POST",
      data: {
        command: "APPEND",
        media_id: mediaId,
        segment_index: i.toString(),
        media_data: chunks[i]!,
      },
    };
    const appendHeaders = oauth.toHeader(
      oauth.authorize(appendRequestData, token),
    );
    const appendResponse = await fetch(appendRequestData.url, {
      method: appendRequestData.method,
      headers: {
        ...appendHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(appendRequestData.data),
    });

    if (!appendResponse.ok) {
      const errorText = await appendResponse.text();
      console.error(`APPEND chunk ${i + 1} failed:`, errorText);
      throw new Error(`Media APPEND failed: ${errorText}`);
    }
  }
  console.log("APPEND phase complete");

  // FINALIZE phase
  console.log("Starting FINALIZE phase...");
  const finalizeRequestData = {
    url: MEDIA_UPLOAD_URL,
    method: "POST",
    data: {
      command: "FINALIZE",
      media_id: mediaId,
    },
  };
  const finalizeHeaders = oauth.toHeader(
    oauth.authorize(finalizeRequestData, token),
  );
  const finalizeResponse = await fetch(finalizeRequestData.url, {
    method: finalizeRequestData.method,
    headers: {
      ...finalizeHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(finalizeRequestData.data),
  });

  if (!finalizeResponse.ok) {
    const errorText = await finalizeResponse.text();
    console.error("FINALIZE failed with:", errorText);
    throw new Error(`Media FINALIZE failed: ${errorText}`);
  }

  const finalizeText = await finalizeResponse.text();
  console.log("FINALIZE response:", finalizeText);
  const finalizeData = JSON.parse(finalizeText) as TwitterMediaStatusResponse;

  if (finalizeData.processing_info) {
    await pollMediaProcessing(
      oauth,
      token,
      mediaId,
      finalizeData.processing_info,
    );
  } else {
    console.log(
      "No processing_info in FINALIZE response, media ready immediately",
    );
  }

  return mediaId;
}

export async function postToTwitter(
  number: number,
  pace: number,
  customMessage: string,
  videoUrl?: string,
): Promise<TwitterResponse> {
  try {
    const oauth = new OAuth({
      consumer: {
        key: TWITTER_CONFIG.apiKey,
        secret: TWITTER_CONFIG.apiKeySecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });

    const token = {
      key: TWITTER_CONFIG.accessToken,
      secret: TWITTER_CONFIG.accessTokenSecret,
    };

    const tweetText = `Wedgie No. ${number}, on pace for ${pace}\n\n${customMessage}\n\nWedgieTracker.com`;

    const mediaId = videoUrl
      ? await uploadVideoToTwitter(oauth, token, videoUrl)
      : undefined;

    // Post the tweet with media
    console.log(
      "Posting tweet...",
      mediaId ? `with media ${mediaId}` : "without media",
    );
    const tweetRequestData = {
      url: "https://api.twitter.com/2/tweets",
      method: "POST",
    };

    const tweetHeaders = oauth.toHeader(
      oauth.authorize(tweetRequestData, token),
    );
    const response = await fetch(tweetRequestData.url, {
      method: tweetRequestData.method,
      headers: {
        ...tweetHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: tweetText,
        media: mediaId ? { media_ids: [mediaId] } : undefined,
      }),
    });

    const data = (await response.json()) as TwitterErrorResponse & {
      data?: { id: string; text: string };
    };

    if (!response.ok) {
      console.error(
        "Tweet post failed:",
        response.status,
        JSON.stringify(data),
      );
      return {
        success: false,
        error: data.errors?.[0]?.message ?? "Failed to post tweet",
      };
    }

    return {
      success: true,
      data: data.data!,
    };
  } catch (error) {
    console.error("Error posting to Twitter:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to post tweet",
    };
  }
}
