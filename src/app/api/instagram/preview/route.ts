import { NextResponse } from "next/server";
import { createReel } from "~/server/dev/instagram";
import { auth } from "~/server/auth";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { isDev } from "~/config/dev-routes";

export async function POST(req: Request) {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const videoUrl = formData.get("videoUrl") as string;
    const number = parseInt(formData.get("number") as string);
    const season = formData.get("season") as string;
    const player = formData.get("player") as string;

    // Download the original video
    const tempInputPath = `/tmp/input_${Date.now()}.mp4`;
    const tempOutputPath = `/tmp/preview_${Date.now()}.mp4`;

    // Download the video
    const response = await fetch(videoUrl);
    const buffer = await response.arrayBuffer();
    await fs.promises.writeFile(tempInputPath, Buffer.from(buffer));

    // Create the preview reel
    await createReel(tempInputPath, tempOutputPath, number, season, player);

    // Upload preview to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(tempOutputPath, {
      resource_type: "video",
      folder: "previews",
    });

    // Clean up temporary files
    await fs.promises.unlink(tempInputPath);
    await fs.promises.unlink(tempOutputPath);

    return NextResponse.json({
      success: true,
      previewUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 },
    );
  }
}
