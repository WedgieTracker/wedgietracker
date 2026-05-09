import { NextResponse } from "next/server";
import { INSTAGRAM_CONFIG } from "~/server/dev/instagram-auth";
import { assertDevMode } from "~/config/dev-routes";

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
  const blocked = assertDevMode();
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect("/admin?error=no_code");
  }

  try {
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

    const redirectPath = state ?? "/admin";
    const finalUrl = new URL(redirectPath, process.env.NEXTAUTH_URL ?? "");
    finalUrl.searchParams.set("instagram_token", longLivedData.access_token);

    return NextResponse.redirect(finalUrl.toString());
  } catch (error) {
    console.error("Instagram auth error:", error);
    return NextResponse.redirect(
      new URL("/admin?error=auth_failed", request.url).toString(),
    );
  }
}
