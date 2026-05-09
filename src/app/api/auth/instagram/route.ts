import { NextResponse } from "next/server";
import { getInstagramAuthUrl } from "~/server/dev/instagram-auth";
import { assertDevMode } from "~/config/dev-routes";

export async function GET(request: Request) {
  const blocked = assertDevMode();
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") ?? undefined;

  return NextResponse.redirect(getInstagramAuthUrl(state));
}
