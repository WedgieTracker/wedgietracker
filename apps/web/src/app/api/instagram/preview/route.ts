import { NextResponse } from "next/server";
import { createReel } from "~/server/dev/instagram";
import fs from "fs";
import { uploadFile } from "~/server/services/r2";
import { requireDevSession } from "~/server/dev/requireDevSession";

export async function POST(req: Request) {
  const guard = await requireDevSession();
  if ("errorResponse" in guard) return guard.errorResponse;

  try {
    const formData = await req.formData();
    const videoUrl = formData.get("videoUrl") as string;
    const number = parseInt(formData.get("number") as string);
    const season = formData.get("season") as string;
    const player = formData.get("player") as string;

    // Download the original video
    const tempInputPath = `/tmp/input_${Date.now()}.mp4`;
    const tempOutputPath = `/tmp/preview_${Date.now()}.mp4`;

    // Download the video
    const response = await fetch(videoUrl, { cache: "no-store" });
    const buffer = await response.arrayBuffer();
    await fs.promises.writeFile(tempInputPath, Buffer.from(buffer));

    // Create the preview reel
    await createReel(tempInputPath, tempOutputPath, number, season, player);

    // Upload the preview so Instagram can fetch it from a public URL
    const previewUrl = await uploadFile(
      tempOutputPath,
      `previews/preview_${Date.now()}.mp4`,
      "video/mp4",
    );

    // Clean up temporary files
    await fs.promises.unlink(tempInputPath);
    await fs.promises.unlink(tempOutputPath);

    return NextResponse.json({
      success: true,
      previewUrl,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 },
    );
  }
}
