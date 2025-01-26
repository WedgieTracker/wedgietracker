import { NextResponse } from "next/server";
import { INSTAGRAM_CONFIG } from "~/server/dev/instagram-auth";
import { cookies } from "next/headers";
import { isDev } from "~/config/dev-routes";

// Add these interfaces
interface ShortLivedTokenResponse {
  access_token: string;
  user_id: number;
  error_type?: string;
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function GET(request: Request) {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore = await cookies();

  if (!code) {
    return NextResponse.redirect("/admin?error=no_code");
  }

  try {
    // Step 1: Exchange code for short-lived token
    const tokenResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: INSTAGRAM_CONFIG.clientId,
          client_secret: INSTAGRAM_CONFIG.clientSecret,
          grant_type: "authorization_code",
          redirect_uri: INSTAGRAM_CONFIG.redirectUri,
          code,
        }),
      },
    );

    const shortLivedData =
      (await tokenResponse.json()) as ShortLivedTokenResponse;

    if (shortLivedData.error_type) {
      return NextResponse.redirect(
        new URL("/admin?error=auth_failed", request.url).toString(),
      );
    }

    // Step 2: Exchange for long-lived token
    const longLivedResponse = await fetch(
      "https://graph.instagram.com/access_token?" +
        new URLSearchParams({
          grant_type: "ig_exchange_token",
          client_secret: INSTAGRAM_CONFIG.clientSecret,
          access_token: shortLivedData.access_token,
        }).toString(),
    );

    const longLivedData =
      (await longLivedResponse.json()) as LongLivedTokenResponse;

    // Get the stored redirect URL from cookies or fallback to /admin/instagram
    const redirectPath =
      cookieStore.get("instagram_redirect")?.value ?? "/admin";
    const finalUrl = new URL(redirectPath, process.env.NEXTAUTH_URL ?? "");
    finalUrl.searchParams.set("instagram_token", longLivedData.access_token);

    // Create the response with redirect
    const response = NextResponse.redirect(finalUrl.toString());

    // Clear the redirect cookie
    response.cookies.delete("instagram_redirect");

    return response;
  } catch (error) {
    console.error("Instagram auth error:", error);
    return NextResponse.redirect(
      new URL("/admin?error=auth_failed", request.url).toString(),
    );
  }
}
