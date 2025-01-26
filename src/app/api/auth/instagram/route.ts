import { NextResponse } from "next/server";
import { getInstagramAuthUrl } from "~/server/dev/instagram-auth";
import { cookies } from "next/headers";
import { isDev } from "~/config/dev-routes";

export async function GET(request: Request) {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  // Set the redirect cookie if state is provided
  if (state) {
    cookieStore.set("instagram_redirect", state);
  }
  // Create response with Instagram auth URL
  const authUrl = getInstagramAuthUrl();
  const response = NextResponse.redirect(authUrl);

  return response;
}
