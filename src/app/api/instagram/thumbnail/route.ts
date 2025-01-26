import { NextResponse } from "next/server";
import { createBackground } from "~/server/dev/createBackground";
import fs from "fs";
import { isDev } from "~/config/dev-routes";

export async function POST(req: Request) {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  try {
    const formData = await req.formData();
    const number = parseInt(formData.get("number") as string);
    const season = formData.get("season") as string;
    const player = formData.get("player") as string;

    const thumbnailPath = await createBackground(
      number,
      season,
      player,
      "thumbnail",
    );

    if (!thumbnailPath) {
      return NextResponse.json(
        { error: "Failed to create thumbnail" },
        { status: 500 },
      );
    }

    const imageBuffer = await fs.promises.readFile(thumbnailPath);
    await fs.promises.unlink(thumbnailPath); // Clean up the temp file

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="thumbnail_${number}_${season}.png"`,
      },
    });
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnail" },
      { status: 500 },
    );
  }
}
