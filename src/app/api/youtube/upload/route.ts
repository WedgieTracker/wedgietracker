import { NextResponse } from "next/server";
import { uploadToYoutube } from "~/server/dev/youtube";
import { auth } from "~/server/auth";
import fs from "fs";
import path from "path";
import { downloadFile } from "~/server/dev/download";
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
    console.log("Session token:", !!session?.user?.accessToken);

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "No access token available - please log in again" },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const videoUrl = formData.get("videoUrl") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tags = (formData.get("tags") as string)?.split(",") ?? [];
    const number = parseInt(formData.get("number") as string);
    const season = formData.get("season") as string;
    const player = formData.get("player") as string;

    // Download the video to temp directory
    const tempPath = `/tmp/${Date.now()}_${path.basename(videoUrl)}`;
    await downloadFile(videoUrl, tempPath);

    const result = await uploadToYoutube(
      tempPath,
      title,
      description,
      tags,
      session,
      number,
      season,
      player,
    );

    // Clean up temp file
    await fs.promises.unlink(tempPath);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in upload handler:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 },
    );
  }
}
