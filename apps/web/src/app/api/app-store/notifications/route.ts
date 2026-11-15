import { NextResponse } from "next/server";
import { handleAppStoreNotification } from "~/server/app-store-notifications";

// App Store Server Notifications V2. Apple posts { signedPayload } here when a
// coffee is refunded, revoked or has its refund reversed, and retries anything
// that isn't a 2xx. Set this URL in App Store Connect, under App Information,
// App Store Server Notifications, Production Server URL (Version 2).

export async function POST(request: Request) {
  let signedPayload: unknown;
  try {
    ({ signedPayload } = (await request.json()) as { signedPayload?: unknown });
  } catch {
    signedPayload = undefined;
  }
  if (typeof signedPayload !== "string" || signedPayload === "") {
    return NextResponse.json({ error: "No signedPayload" }, { status: 400 });
  }

  const result = await handleAppStoreNotification(signedPayload);
  return NextResponse.json(result, {
    status: result.status === "rejected" ? 400 : 200,
  });
}
