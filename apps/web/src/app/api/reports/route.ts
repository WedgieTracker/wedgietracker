import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { wedgieReport } from "@wedgietracker/core/schema";
import { env } from "~/env";

// Wrong-info reports for the admin's own assistant, which checks here every few minutes instead
// of receiving them on Telegram. Read with GET, resolve with POST {id, resolved}. Both need
// "Authorization: Bearer <REPORTS_API_KEY>"; without that key set, the route answers 404.

function authorised(request: Request) {
  const key = env.REPORTS_API_KEY;
  if (!key) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${key}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const resolved = new URL(request.url).searchParams.get("resolved") === "true";
  const reports = await db.query.wedgieReport.findMany({
    where: eq(wedgieReport.resolved, resolved),
    orderBy: desc(wedgieReport.createdAt),
    limit: 100,
    with: {
      wedgie: {
        columns: {
          id: true,
          number: true,
          seasonName: true,
          playerName: true,
          teamName: true,
          teamAgainstName: true,
        },
      },
    },
  });
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    resolved?: unknown;
  } | null;
  if (
    !body ||
    typeof body.id !== "number" ||
    typeof body.resolved !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Expected {id, resolved}" },
      { status: 400 },
    );
  }
  await db
    .update(wedgieReport)
    .set({ resolved: body.resolved })
    .where(eq(wedgieReport.id, body.id));
  return NextResponse.json({ ok: true });
}
