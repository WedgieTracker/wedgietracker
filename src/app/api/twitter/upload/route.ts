import { NextResponse } from "next/server";
import { postToTwitter } from "~/server/dev/twitter";
import { auth } from "~/server/auth";
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
    const number = parseInt(formData.get("number") as string);
    const pace = parseInt(formData.get("pace") as string);
    const customMessage = formData.get("customMessage") as string;
    const videoUrl = formData.get("videoUrl") as string;
    const twitterToken = req.headers.get("Authorization")?.split(" ")[1];

    if (!twitterToken) {
      return NextResponse.json(
        { error: "Unauthorized twitter token" },
        { status: 401 },
      );
    }

    const result = await postToTwitter(number, pace, customMessage, videoUrl);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in twitter upload handler:", error);
    return NextResponse.json(
      { error: "Failed to post tweet" },
      { status: 500 },
    );
  }
}
