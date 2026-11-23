import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";
import { decideBoardName, listPendingBoardNames } from "~/server/coffee-board";

// Coffee leaderboard names waiting for approval, for Butler. GET lists them;
// POST { id, name, status } approves or rejects one, and
// { id, name, status: "pending", from } undoes that. Same key as
// /api/external ("x-api-key").
//
// The POST names the exact text it decides. If the buyer has changed it
// since, or it was already decided the other way on /admin/coffees, the
// answer is 409 with the name and status it has now; an unknown id is 404.
// Repeating a decision already made is 200.

function authorised(request: Request) {
  const given = Buffer.from(request.headers.get("x-api-key") ?? "");
  const want = Buffer.from(env.WEDGIETRACKER_API_KEY);
  return given.length === want.length && timingSafeEqual(given, want);
}

const decision = z.discriminatedUnion("status", [
  z.object({
    id: z.string().min(1).max(300),
    name: z.string().min(1).max(200),
    status: z.enum(["approved", "rejected"]),
  }),
  z.object({
    id: z.string().min(1).max(300),
    name: z.string().min(1).max(200),
    status: z.literal("pending"),
    from: z.enum(["approved", "rejected"]),
  }),
]);

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ pending: await listPendingBoardNames() });
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = decision.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const body = parsed.data;
  const outcome = await decideBoardName(
    body.id,
    body.name,
    body.status,
    body.status === "pending" ? body.from : undefined,
  );
  if (outcome.result === "not-found") {
    return NextResponse.json({ error: "No such purchase" }, { status: 404 });
  }
  if (outcome.result === "conflict") {
    return NextResponse.json(
      { error: "Changed or already decided", current: outcome.current },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
