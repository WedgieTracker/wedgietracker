import { BskyAgent, RichText } from "@atproto/api";
import { NextResponse } from "next/server";
import { BLUESKY_CONFIG } from "~/server/dev/bluesky-auth";
import { isDev } from "~/config/dev-routes";
interface VideoBlob {
  $type: string;
  ref: { $link: string };
  mimeType: string;
  size: number;
}

export async function POST(req: Request) {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  try {
    const agent = new BskyAgent({ service: BLUESKY_CONFIG.service });
    await agent.login({
      identifier: BLUESKY_CONFIG.identifier,
      password: BLUESKY_CONFIG.appPassword,
    });

    const formData = await req.formData();
    const customMessage = formData.get("customMessage") as string;
    const pace = formData.get("pace") as string;
    const number = formData.get("number") as string;
    const videoUrl = formData.get("videoUrl") as string;

    const baseText = `Wedgie No. ${number}, on pace for ${pace}\n\n${customMessage}\n\n#WeAreWedgie\n\nWedgieTracker.com`;

    // Create rich text with proper facets
    const rt = new RichText({ text: baseText });
    await rt.detectFacets(agent); // This will automatically detect links, mentions, and tags

    let embed;
    if (videoUrl) {
      // Get service auth token with the correct audience
      const { data: serviceAuth } =
        await agent.com.atproto.server.getServiceAuth({
          aud: "did:web:helvella.us-east.host.bsky.network",
          lxm: "com.atproto.repo.uploadBlob",
          exp: Date.now() / 1000 + 60 * 30,
        });

      // Fetch video from Cloudinary as a stream
      const response = await fetch(videoUrl, {
        headers: {
          Accept: "video/mp4",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch video");
      const contentLength = response.headers.get("content-length");

      // Prepare upload URL
      const uploadUrl = new URL(
        "https://video.bsky.app/xrpc/app.bsky.video.uploadVideo",
      );
      uploadUrl.searchParams.append("did", agent.session!.did);
      uploadUrl.searchParams.append("name", `wedgie-${number}.mp4`);

      interface CustomRequestInit extends RequestInit {
        duplex: "half";
      }

      // Define interface for job status response
      interface VideoJobStatus {
        error?: string;
        blob?: {
          $type: string;
          ref: { $link: string };
          mimeType: string;
          size: number;
        };
        jobId?: string;
      }

      // Upload video with proper typing
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceAuth.token}`,
          "Content-Type": "video/mp4",
          "Content-Length": contentLength ?? "",
        },
        body: response.body,
        duplex: "half",
      } as CustomRequestInit);

      const jobStatus: VideoJobStatus =
        (await uploadResponse.json()) as VideoJobStatus;
      console.log("Job Status:", jobStatus);

      if (jobStatus.error && jobStatus.error !== "already_exists") {
        throw new Error(jobStatus.error);
      }

      let videoBlob: VideoBlob | undefined = jobStatus.blob;
      const videoAgent = new BskyAgent({ service: "https://video.bsky.app" });

      if (!jobStatus.jobId) {
        throw new Error("No job ID received from video upload");
      }

      // Poll for job completion if video isn't already processed
      while (!videoBlob) {
        const { data: status } = await videoAgent.app.bsky.video.getJobStatus({
          jobId: jobStatus.jobId,
        });
        console.log(
          "Status:",
          status.jobStatus.state,
          status.jobStatus.progress ?? "",
        );
        if (status.jobStatus.blob) {
          videoBlob = {
            $type: "blob",
            ref: status.jobStatus.blob.ref as { $link: string },
            mimeType: status.jobStatus.blob.mimeType,
            size: status.jobStatus.blob.size,
          } as VideoBlob;
        }
      }

      // Remove the separate video post
      embed = {
        $type: "app.bsky.embed.video",
        video: videoBlob,
        aspectRatio: { width: 16, height: 9 }, // Default aspect ratio
      };
    }

    // Create single post with both text and video
    await agent.post({
      text: rt.text,
      facets: rt.facets,
      embed: embed,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to post",
      },
      { status: 400 },
    );
  }
}
