import { BskyAgent } from "@atproto/api";
import { NextResponse } from "next/server";
import { isDev } from "~/config/dev-routes";

interface LoginRequest {
  identifier: string;
  password: string;
}

export async function POST(req: Request) {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  try {
    const { identifier, password }: LoginRequest =
      (await req.json()) as LoginRequest;
    const agent = new BskyAgent({ service: "https://bsky.social" });

    await agent.login({ identifier, password });

    return NextResponse.json({
      success: true,
      token: JSON.stringify({
        accessJwt: agent.session?.accessJwt,
        refreshJwt: agent.session?.refreshJwt,
        handle: agent.session?.handle,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to authenticate",
      },
      { status: 400 },
    );
  }
}
