import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { and, eq, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { game, player, team, wedgie } from "@wedgietracker/core/schema";
import { env } from "~/env";
import { invalidateStoreData, invalidateWedgieData } from "~/server/cache";
import {
  maybeUpdateGlobalWedgieCount,
  syncWedgieTypes,
} from "~/server/db-helpers";

// Adds a wedgie from a NoDunks tweet once the admin has confirmed the draft on his phone, the
// same record the admin form would save. Same key as /api/external ("x-api-key"). Idempotent on
// season + number: a second POST returns the wedgie already there. PATCH fills in video links
// once the clip is posted; DELETE undoes a wedgie added by mistake.

function authorised(request: Request) {
  const given = Buffer.from(request.headers.get("x-api-key") ?? "");
  const want = Buffer.from(env.WEDGIETRACKER_API_KEY);
  return given.length === want.length && timingSafeEqual(given, want);
}

const videoUrl = z.object({
  cloudinary: z.string().url().optional(),
  youtube: z.string().url().optional(),
  youtubeNoDunks: z.string().optional(),
  instagram: z.string().url().optional(),
});

const key = z.object({
  seasonName: z.string().regex(/^\d{4}\/\d{2}$/),
  number: z.number().int().positive(),
});

const createInput = key.extend({
  playerName: z.string().min(2),
  teamName: z.string().min(2),
  teamAgainstName: z.string().min(2),
  gameName: z.string().min(5),
  position: z.object({ x: z.number(), y: z.number() }).nullable(),
  types: z.array(z.string()).min(1),
  videoUrl: videoUrl.default({}),
  shoutouts: z.array(z.string().regex(/^[A-Za-z0-9_]{1,15}$/)).default([]),
  period: z.number().int().min(1).max(10).nullable().default(null),
  gameClock: z
    .string()
    .regex(/^\d{1,2}:\d{2}(\.\d)?$/)
    .nullable()
    .default(null),
  teamScore: z.number().int().nullable().default(null),
  opponentScore: z.number().int().nullable().default(null),
  noDunksTweet: z
    .object({ id: z.string(), text: z.string(), postedAt: z.string() })
    .nullable()
    .default(null),
  dryRun: z.boolean().default(false),
});

function findWedgie(seasonName: string, number: number) {
  return db.query.wedgie.findFirst({
    where: and(eq(wedgie.seasonName, seasonName), eq(wedgie.number, number)),
  });
}

// The game list names games "HOME @ AWAY - <tip time>", with the tip in US Eastern time written
// as if UTC; a caller holding the real UTC tip-off finds the same game by teams and the nearest
// tip within 12 hours.
async function pickGame(name: string) {
  const exact = await db.query.game.findFirst({ where: eq(game.name, name) });
  if (exact) return exact;
  const [teams, tip] = name.split(" - ");
  const wanted = Date.parse(tip ?? "");
  if (!teams || Number.isNaN(wanted)) return undefined;
  const candidates = await db.query.game.findMany({
    where: like(game.name, `${teams} - %`),
  });
  const near = candidates
    .map((g) => ({
      g,
      gap: Math.abs(Date.parse(g.name.split(" - ")[1] ?? "") - wanted),
    }))
    .filter((c) => c.gap <= 12 * 3600 * 1000)
    .sort((a, b) => a.gap - b.gap);
  return near[0]?.g;
}

async function readBody(request: Request) {
  return (await request.json().catch(() => null)) as unknown;
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = createInput.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid wedgie", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { dryRun, types, ...data } = parsed.data;

  const existing = await findWedgie(data.seasonName, data.number);
  if (existing) {
    return NextResponse.json({ created: false, wedgie: existing });
  }

  // The game comes from the site's own game list, as when it is picked in the admin; its
  // date is the wedgie's date.
  const picked = await pickGame(data.gameName);
  if (!picked) {
    return NextResponse.json(
      { error: `Unknown game ${data.gameName}` },
      { status: 400 },
    );
  }

  const record = {
    ...data,
    gameName: picked.name,
    position: data.position ?? { x: 0, y: 0 },
    wedgieDate: new Date(picked.createdAt).toISOString(),
  };
  if (dryRun) {
    return NextResponse.json({ dryRun: true, wedgie: { ...record, types } });
  }

  await db
    .insert(player)
    .values({ name: data.playerName })
    .onConflictDoNothing();
  await db
    .insert(team)
    .values([{ name: data.teamName }, { name: data.teamAgainstName }])
    .onConflictDoNothing();

  const [created] = await db.insert(wedgie).values(record).returning();
  if (created) {
    await syncWedgieTypes(db, created.id, types);
  }
  await maybeUpdateGlobalWedgieCount(db, data.seasonName);
  invalidateWedgieData();
  invalidateStoreData();

  return NextResponse.json({ created: true, wedgie: created });
}

export async function PATCH(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = key.extend({ videoUrl }).safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const existing = await findWedgie(parsed.data.seasonName, parsed.data.number);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [updated] = await db
    .update(wedgie)
    .set({ videoUrl: { ...existing.videoUrl, ...parsed.data.videoUrl } })
    .where(eq(wedgie.id, existing.id))
    .returning();
  invalidateWedgieData();
  return NextResponse.json({ wedgie: updated });
}

export async function DELETE(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = key.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }
  const [deleted] = await db
    .delete(wedgie)
    .where(
      and(
        eq(wedgie.seasonName, parsed.data.seasonName),
        eq(wedgie.number, parsed.data.number),
      ),
    )
    .returning();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  invalidateWedgieData();
  invalidateStoreData();
  return NextResponse.json({ deleted: true, wedgie: deleted });
}
