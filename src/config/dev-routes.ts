import { NextResponse } from "next/server";

export const isDev = process.env.NODE_ENV === "development";

/**
 * Returns a 404 response if not in development mode, or null if dev mode is active.
 * Usage: `const blocked = assertDevMode(); if (blocked) return blocked;`
 */
export function assertDevMode() {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }
  return null;
}
