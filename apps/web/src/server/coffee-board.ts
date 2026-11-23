import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { coffeeCheckout, global } from "@wedgietracker/core/schema";
import { db } from "~/server/db";
import { CACHE_TAGS } from "~/server/cache";

/** The longest name the leaderboard takes, here, on Stripe and in the app. */
export const BOARD_NAME_MAX = 24;

/** The Stripe Checkout custom field the name is typed into. */
export const STRIPE_NAME_FIELD = "board_name";

/**
 * The key every hash here is made with. Derived from the auth secret with a
 * fixed label, so the leaderboard needs no secret of its own and its keys
 * can't be mistaken for anything auth makes.
 */
function boardKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret)
    .update("wedgietracker coffee leaderboard v1")
    .digest();
}

function hmac(value: string) {
  return createHmac("sha256", boardKey()).update(value).digest("base64url");
}

/**
 * A name as the board shows it: control characters out, runs of spaces made
 * one, trimmed, at most BOARD_NAME_MAX characters. Empty means anonymous.
 */
export function cleanBoardName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const name = [
    ...raw
      .replace(/\p{Cc}/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ]
    .slice(0, BOARD_NAME_MAX)
    .join("")
    .trim();
  return name || null;
}

/** One buyer's place on the board from their Stripe email, without storing it. */
export function donorKeyForEmail(email: string) {
  return `e:${hmac(`email:${email.trim().toLowerCase()}`).slice(0, 32)}`;
}

/** One app install's place on the board, from the random id it keeps. */
export function donorKeyForInstall(installId: string) {
  return `i:${hmac(`install:${installId}`).slice(0, 32)}`;
}

/**
 * The link token that lets a past buyer name their coffees: the checkout id
 * and a signature over it, so only a link we sent works.
 */
export function claimToken(sessionId: string) {
  return `${sessionId}.${hmac(`claim:${sessionId}`).slice(0, 32)}`;
}

/** The checkout id a claim token is for, or null if it isn't one of ours. */
export function sessionIdFromClaim(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const sessionId = token.slice(0, dot);
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const want = Buffer.from(claimToken(sessionId));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got)
    ? sessionId
    : null;
}

/** The name typed into Stripe's checkout field, cleaned, or null. */
export function stripeBoardName(session: Stripe.Checkout.Session) {
  const field = session.custom_fields?.find((f) => f.key === STRIPE_NAME_FIELD);
  return cleanBoardName(field?.text?.value);
}

/**
 * Stores what Stripe knows about a counted checkout: the buyer's donor key,
 * and the name from the checkout field. Stripe's name only fills an empty
 * one, so a name saved from the thanks page, which may come first, is never
 * overwritten by a later visit.
 */
export async function saveStripeBoardDetails(
  sessionId: string,
  session: Stripe.Checkout.Session,
) {
  const email = session.customer_details?.email;
  if (email) {
    await db
      .update(coffeeCheckout)
      .set({ donorKey: donorKeyForEmail(email) })
      .where(
        and(
          eq(coffeeCheckout.sessionId, sessionId),
          isNull(coffeeCheckout.donorKey),
        ),
      );
  }
  const name = stripeBoardName(session);
  if (name) {
    await db
      .update(coffeeCheckout)
      .set({ displayName: name, nameStatus: "pending" })
      .where(
        and(
          eq(coffeeCheckout.sessionId, sessionId),
          isNull(coffeeCheckout.displayName),
        ),
      );
  }
}

/**
 * Stores what a newer app sends with a purchase: its install's donor key and
 * the name typed after buying. Like Stripe's, the name only fills an empty one.
 */
export async function saveAppBoardDetails(
  key: string,
  { name, installId }: { name?: string | null; installId?: string | null },
) {
  if (installId) {
    await db
      .update(coffeeCheckout)
      .set({ donorKey: donorKeyForInstall(installId) })
      .where(
        and(eq(coffeeCheckout.sessionId, key), isNull(coffeeCheckout.donorKey)),
      );
  }
  const clean = cleanBoardName(name);
  if (clean) {
    await db
      .update(coffeeCheckout)
      .set({ displayName: clean, nameStatus: "pending" })
      .where(
        and(
          eq(coffeeCheckout.sessionId, key),
          isNull(coffeeCheckout.displayName),
        ),
      );
    revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
  }
}

/**
 * Sets the board name a buyer chose for one purchase. The form always wins
 * over Stripe's field. A new or changed name waits for approval; saving the
 * name that's already approved keeps it approved; an empty one goes back to
 * anonymous. Returns false when there's no such purchase.
 */
export async function setBoardName(key: string, raw: string | null) {
  const name = cleanBoardName(raw);
  const [row] = await db
    .select({
      displayName: coffeeCheckout.displayName,
      nameStatus: coffeeCheckout.nameStatus,
    })
    .from(coffeeCheckout)
    .where(eq(coffeeCheckout.sessionId, key))
    .limit(1);
  if (!row) return false;

  const unchanged = name === row.displayName;
  await db
    .update(coffeeCheckout)
    .set({
      displayName: name,
      nameStatus: name ? (unchanged ? row.nameStatus : "pending") : null,
    })
    .where(eq(coffeeCheckout.sessionId, key));
  revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
  return true;
}

/** The name a purchase has now, for filling in the form. */
export async function getBoardName(key: string) {
  const [row] = await db
    .select({ displayName: coffeeCheckout.displayName })
    .from(coffeeCheckout)
    .where(eq(coffeeCheckout.sessionId, key))
    .limit(1);
  return row?.displayName ?? null;
}

export type BoardRow = { name: string | null; coffees: number };

/**
 * Groups purchases into board places: one per donor key, or one per purchase
 * when it has none. A place shows the newest approved name among its
 * purchases, else it's anonymous. Biggest first; ties keep their order.
 */
export function boardRows(
  rows: {
    sessionId: string;
    donorKey: string | null;
    coffees: number;
    displayName: string | null;
    nameStatus: string | null;
    createdAt: string;
  }[],
): BoardRow[] {
  const places = new Map<
    string,
    { coffees: number; name: string | null; namedAt: string }
  >();
  for (const r of rows) {
    const key = r.donorKey ?? `s:${r.sessionId}`;
    const place = places.get(key) ?? { coffees: 0, name: null, namedAt: "" };
    place.coffees += r.coffees;
    if (
      r.nameStatus === "approved" &&
      r.displayName &&
      r.createdAt >= place.namedAt
    ) {
      place.name = r.displayName;
      place.namedAt = r.createdAt;
    }
    places.set(key, place);
  }
  return [...places.values()]
    .map(({ name, coffees }) => ({ name, coffees }))
    .sort((a, b) => b.coffees - a.coffees);
}

/** This season's coffee leaderboard. Cached until coffees or names change. */
export async function getCoffeeBoard(): Promise<{
  season: string | null;
  rows: BoardRow[];
}> {
  "use cache";
  cacheTag(CACHE_TAGS.COFFEES);
  cacheLife("max");

  const settings = await db.query.global.findFirst({
    where: eq(global.id, 1),
    with: { currentSeason: true },
  });
  const season = settings?.currentSeason.name ?? null;
  if (!season) return { season, rows: [] };

  const rows = await db
    .select({
      sessionId: coffeeCheckout.sessionId,
      donorKey: coffeeCheckout.donorKey,
      coffees: coffeeCheckout.coffees,
      displayName: coffeeCheckout.displayName,
      nameStatus: coffeeCheckout.nameStatus,
      createdAt: coffeeCheckout.createdAt,
    })
    .from(coffeeCheckout)
    .where(
      and(
        eq(coffeeCheckout.seasonName, season),
        isNull(coffeeCheckout.refundedAt),
      ),
    );
  return { season, rows: boardRows(rows) };
}

/** Names waiting for approval, newest first, for the admin. */
export async function listBoardNames() {
  return db
    .select({
      sessionId: coffeeCheckout.sessionId,
      displayName: coffeeCheckout.displayName,
      nameStatus: coffeeCheckout.nameStatus,
      coffees: coffeeCheckout.coffees,
      seasonName: coffeeCheckout.seasonName,
      createdAt: coffeeCheckout.createdAt,
    })
    .from(coffeeCheckout)
    .where(sql`${coffeeCheckout.displayName} is not null`)
    .orderBy(
      sql`case ${coffeeCheckout.nameStatus} when 'pending' then 0 else 1 end`,
      desc(coffeeCheckout.createdAt),
    );
}

/** Approves or rejects a name, from the admin; a rejected one shows as Anonymous. */
export async function setBoardNameStatus(
  key: string,
  status: "approved" | "rejected",
) {
  await db
    .update(coffeeCheckout)
    .set(
      status === "approved"
        ? { nameStatus: status, approvedName: coffeeCheckout.displayName }
        : { nameStatus: status },
    )
    .where(
      and(
        eq(coffeeCheckout.sessionId, key),
        sql`${coffeeCheckout.displayName} is not null`,
      ),
    );
  revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
}

export type NameDecision =
  | { result: "ok" }
  | { result: "not-found" }
  | {
      result: "conflict";
      current: { name: string | null; status: string | null };
    };

/**
 * Decides one name from Butler's card. It names the exact text it decides,
 * so a name the buyer changed after the card was made is never approved
 * unseen. Sending the status it already has is fine (a repeated tap); a
 * name already decided the other way, on the admin page, is a conflict.
 * "pending" with `from` undoes a decision, if it's still the one made.
 */
export async function decideBoardName(
  key: string,
  name: string,
  status: "approved" | "rejected" | "pending",
  from?: "approved" | "rejected",
): Promise<NameDecision> {
  const [row] = await db
    .select({
      name: coffeeCheckout.displayName,
      status: coffeeCheckout.nameStatus,
    })
    .from(coffeeCheckout)
    .where(eq(coffeeCheckout.sessionId, key))
    .limit(1);
  if (!row) return { result: "not-found" };
  const conflict = { result: "conflict" as const, current: row };
  if (row.name !== name) return conflict;
  if (row.status === status) return { result: "ok" };
  if (status === "pending" ? row.status !== from : row.status !== "pending") {
    return conflict;
  }

  // Changes only the row as it was read, so a buyer's edit in between wins.
  const changed = await db
    .update(coffeeCheckout)
    .set(
      status === "approved"
        ? { nameStatus: status, approvedName: name }
        : { nameStatus: status },
    )
    .where(
      and(
        eq(coffeeCheckout.sessionId, key),
        eq(coffeeCheckout.displayName, name),
        row.status === null
          ? isNull(coffeeCheckout.nameStatus)
          : eq(coffeeCheckout.nameStatus, row.status),
      ),
    )
    .returning({ sessionId: coffeeCheckout.sessionId });
  if (changed.length === 0) return conflict;
  revalidateTag(CACHE_TAGS.COFFEES, { expire: 0 });
  return { result: "ok" };
}

/**
 * Names waiting for approval, oldest first, for Butler. `previousName` is
 * the last one approved for the same purchase, or null for a first name.
 */
export async function listPendingBoardNames() {
  const rows = await db
    .select({
      id: coffeeCheckout.sessionId,
      name: coffeeCheckout.displayName,
      approvedName: coffeeCheckout.approvedName,
      coffees: coffeeCheckout.coffees,
      season: coffeeCheckout.seasonName,
      createdAt: coffeeCheckout.createdAt,
    })
    .from(coffeeCheckout)
    .where(
      and(
        eq(coffeeCheckout.nameStatus, "pending"),
        sql`${coffeeCheckout.displayName} is not null`,
        isNull(coffeeCheckout.refundedAt),
      ),
    )
    .orderBy(coffeeCheckout.createdAt);
  return rows.map(({ approvedName, ...r }) => ({
    ...r,
    name: r.name!,
    previousName: approvedName && approvedName !== r.name ? approvedName : null,
    source: r.id.startsWith("appstore:")
      ? ("app" as const)
      : ("stripe" as const),
  }));
}
