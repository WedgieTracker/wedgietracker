import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { isAllowedEmail } from "~/server/auth/allowlist";
import { presignUpload } from "~/server/services/r2";

const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
};

const bodySchema = z.object({ contentType: z.string() });

/**
 * Hands the admin a presigned URL so the video goes straight from the browser
 * to R2, rather than through a function with a 4.5 MB request body limit.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAllowedEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const extension = parsed.success
    ? VIDEO_EXTENSIONS[parsed.data.contentType]
    : undefined;
  if (!parsed.success || !extension) {
    return NextResponse.json(
      { error: "Unsupported video type" },
      { status: 400 },
    );
  }

  const key = `wedgies/${randomUUID()}.${extension}`;
  return NextResponse.json(await presignUpload(key, parsed.data.contentType));
}
