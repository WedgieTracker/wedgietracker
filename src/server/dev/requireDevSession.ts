import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { assertDevMode } from "~/config/dev-routes";

/**
 * Guards a dev-only route: blocks in production, requires an authenticated
 * session, and otherwise returns the session for the handler to use.
 *
 * Usage:
 *   const result = await requireDevSession();
 *   if ("errorResponse" in result) return result.errorResponse;
 *   const { session } = result;
 */
export async function requireDevSession() {
  const blocked = assertDevMode();
  if (blocked) return { errorResponse: blocked } as const;

  const session = await auth();
  if (!session?.user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    } as const;
  }
  return { session } as const;
}
