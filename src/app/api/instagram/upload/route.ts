import { NextResponse } from "next/server";
import { uploadToInstagram } from "~/server/dev/instagram";
import { requireDevSession } from "~/server/dev/requireDevSession";

export async function POST(req: Request) {
  const guard = await requireDevSession();
  if ("errorResponse" in guard) return guard.errorResponse;
  const { session } = guard;

  try {
    const formData = await req.formData();
    const videoUrl = formData.get("videoUrl") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const number = parseInt(formData.get("number") as string);
    const season = formData.get("season") as string;
    const player = formData.get("player") as string;
    const instagramToken = req.headers.get("Authorization")?.split(" ")[1];

    if (!instagramToken) {
      return NextResponse.json(
        { error: "Unauthorized instagram token" },
        { status: 401 },
      );
    }

    const result = await uploadToInstagram(
      videoUrl,
      title,
      description,
      session,
      number,
      season,
      player,
      instagramToken,
    );

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
