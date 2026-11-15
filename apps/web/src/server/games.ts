import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { game, wedgie } from "@wedgietracker/core/schema";
import {
  easternDay,
  gameColumns,
  parseGameName,
} from "@wedgietracker/core/utils/game";
import type { db as Db } from "./db";

type Game = typeof game.$inferSelect;

/** The structured columns a new game row gets, read from the name it arrives with. */
export function gameColumnsFromName(name: string) {
  const parsed = parseGameName(name);
  return {
    homeTeam: parsed?.homeTeam ?? null,
    awayTeam: parsed?.awayTeam ?? null,
    gameDate: parsed?.gameDate ?? null,
  };
}

const isoDateTime = z.iso.datetime({ offset: true });

/**
 * A game's `tipUtc` as stored in tip_at: undefined when it wasn't sent (or was
 * null), null when it isn't an ISO date-time with a zone, else the instant in
 * UTC ("2026-11-15T01:00:00.000Z").
 */
export function parseTipUtc(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !isoDateTime.safeParse(value).success) {
    return null;
  }
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** Why a batch of incoming games can't be taken, or null when it can: a tipUtc that isn't an ISO UTC date-time. */
export function incomingGamesProblem(incoming: unknown): string | null {
  if (!Array.isArray(incoming)) return null;
  for (const g of incoming as Partial<IncomingGame>[]) {
    if (g && parseTipUtc(g.tipUtc) === null) {
      return `tipUtc of ${String(g.name)} must be an ISO date-time with a zone, like 2026-11-15T01:00:00Z; got ${JSON.stringify(g.tipUtc)}`;
    }
  }
  return null;
}

/**
 * The tip-off columns a game sent with tipUtc gets: tip_at, and game_date as
 * the US Eastern day of the tip-off, which the name's day may not be. Nothing
 * when tipUtc wasn't sent.
 */
function tipColumns(g: IncomingGame) {
  const tipAt = parseTipUtc(g.tipUtc);
  return tipAt ? { tipAt, gameDate: easternDay(tipAt) } : {};
}

/**
 * The game a wedgie saved from the admin points at: by id when the form picked
 * one, else by the old name text. No id and no name means no game (GEMS).
 */
export async function findLinkedGame(
  db: typeof Db,
  { gameId, gameName }: { gameId?: number | null; gameName?: string | null },
): Promise<{ game: Game | null } | { error: string }> {
  if (gameId != null) {
    const found = await db.query.game.findFirst({ where: eq(game.id, gameId) });
    return found ? { game: found } : { error: `Unknown game id ${gameId}` };
  }
  const name = gameName?.trim();
  if (!name) return { game: null };
  const found = await db.query.game.findFirst({ where: eq(game.name, name) });
  return found ? { game: found } : { error: `Unknown game ${name}` };
}

const TWELVE_HOURS = 12 * 3600 * 1000;

/**
 * The instant a caller of the external API means by the game it names,
 * "HOME @ AWAY - 2026-11-09T00:30:00Z": the part after the day, read as a real
 * UTC date-time from the caller (stored names are never read this way). Null
 * when it has no zone, so only the day it names counts.
 */
function callerInstant(name: string) {
  const at = name.slice(name.lastIndexOf(" - ") + 3);
  return isoDateTime.safeParse(at).success ? Date.parse(at) : null;
}

/**
 * The game a caller of the external API names, "HOME @ AWAY - <UTC tip>". An
 * exact name is that game. Otherwise the same two teams, in either order (the
 * same two teams never meet twice within 12 hours, so "AWAY @ HOME", NBA
 * notation, finds the same game), and either a stored tip_at within 12 hours
 * of the caller's tip, or, for a game whose tip-off isn't known, the same US
 * Eastern day. A known tip-off is preferred, the nearest first.
 */
export async function pickGame(db: typeof Db, name: string) {
  const exact = await db.query.game.findFirst({ where: eq(game.name, name) });
  if (exact) return exact;
  const wanted = parseGameName(name);
  if (!wanted) return undefined;
  const at = callerInstant(name);
  const day = at == null ? wanted.gameDate : easternDay(new Date(at));
  const { homeTeam: a, awayTeam: b } = wanted;
  const candidates = await db.query.game.findMany({
    where: or(
      and(eq(game.homeTeam, a), eq(game.awayTeam, b)),
      and(eq(game.homeTeam, b), eq(game.awayTeam, a)),
    ),
  });
  const near = candidates
    .filter((g) => {
      const c = gameColumns(g);
      return (
        c &&
        ((c.homeTeam === a && c.awayTeam === b) ||
          (c.homeTeam === b && c.awayTeam === a))
      );
    })
    .map((g) => {
      const tip = g.tipAt ? Date.parse(g.tipAt) : NaN;
      if (at != null && !Number.isNaN(tip)) {
        return { g, gap: Math.abs(tip - at) };
      }
      // no tip-off to compare: the same Eastern day, after any known tip
      return { g, gap: gameColumns(g)?.gameDate === day ? TWELVE_HOURS : NaN };
    })
    .filter((c) => c.gap <= TWELVE_HOURS)
    .sort((x, y) => x.gap - y.gap);
  return near[0]?.g;
}

/** A game the external API is sent, with its NBA game id when the caller has one. */
export interface IncomingGame {
  /** The NBA game id, "0022600150" or 22600150. */
  id?: string | number | null;
  /** Same as id, under the name the caller keeps it as. */
  gameId?: string | number | null;
  name: string;
  createdAt: Date | string;
  seasonName: string;
  live: boolean;
  /**
   * The real tip-off as an ISO UTC date-time, "2026-11-15T01:00:00Z". Stored
   * as tip_at, and its US Eastern day becomes game_date. Optional: without it
   * game_date comes from the name, as before.
   */
  tipUtc?: string | null;
}

/**
 * The game row id an NBA game id stands for: "0022600150" is 22600150. Null
 * for anything that isn't a positive whole number of up to 10 digits.
 */
export function parseNbaGameId(value: unknown): number | null {
  const text =
    typeof value === "number"
      ? Number.isSafeInteger(value)
        ? String(value)
        : ""
      : typeof value === "string"
        ? value.trim()
        : "";
  if (!/^\d{1,10}$/.test(text)) return null;
  const id = Number(text);
  return id > 0 ? id : null;
}

/**
 * Whether a stored row is the game a name describes: the same name, or the
 * same two teams in either order (a game moved to another day keeps its NBA
 * id, so the day isn't compared).
 */
function isSameGame(row: Game, name: string) {
  if (row.name === name) return true;
  const stored = gameColumns(row);
  const wanted = parseGameName(name);
  if (!stored || !wanted) return false;
  return (
    (stored.homeTeam === wanted.homeTeam &&
      stored.awayTeam === wanted.awayTeam) ||
    (stored.homeTeam === wanted.awayTeam && stored.awayTeam === wanted.homeTeam)
  );
}

/**
 * Brings a stored game up to date with what the caller sent: its name, teams,
 * day, tip-off (when tipUtc is sent) and live state. A new name is written onto the game's wedgies too, so
 * wedgie.game_name keeps matching game.name.
 */
async function updateKnownGame(db: typeof Db, row: Game, g: IncomingGame) {
  let name = g.name;
  if (name !== row.name) {
    const taken = await db.query.game.findFirst({
      where: eq(game.name, name),
      columns: { id: true },
    });
    if (taken && taken.id !== row.id) {
      console.warn(
        `Game ${row.id} can't be renamed to ${name}, game ${taken.id} has that name`,
      );
      name = row.name;
    }
  }
  const columns =
    name === g.name
      ? gameColumnsFromName(name)
      : {
          homeTeam: row.homeTeam,
          awayTeam: row.awayTeam,
          gameDate: row.gameDate,
        };

  await db.transaction(async (tx) => {
    await tx
      .update(game)
      .set({ name, ...columns, ...tipColumns(g), live: g.live })
      .where(eq(game.id, row.id));
    if (name !== row.name) {
      await tx
        .update(wedgie)
        .set({ gameName: name, gameId: row.id })
        .where(or(eq(wedgie.gameId, row.id), eq(wedgie.gameName, row.name)));
    }
  });
}

/**
 * Saves the games the external API is sent. A game sent with its NBA game id
 * is stored under that id, marked id_source 'nba'; a game already stored under
 * it is the same game and is updated, never added twice. A game sent without
 * one is matched by name and otherwise added with the next free id, marked
 * 'site'. Older games keep the ids they have: when a 'site' game arrives with
 * its real NBA id it is logged, not renumbered, since renumbering is a
 * separate reviewed step. If the NBA id is already taken by a different game,
 * the new game gets the next free id instead, as 'site', and the clash is
 * logged.
 */
export async function syncIncomingGames(
  db: typeof Db,
  incoming: IncomingGame[],
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const g of incoming) {
    const nbaId = parseNbaGameId(g.id ?? g.gameId);
    let id = nbaId;

    if (id != null) {
      const byId = await db.query.game.findFirst({ where: eq(game.id, id) });
      if (byId && isSameGame(byId, g.name)) {
        await updateKnownGame(db, byId, g);
        if (byId.idSource === "derived") {
          // the NBA has now sent the id that was worked out for this game
          await db
            .update(game)
            .set({ idSource: "nba" })
            .where(eq(game.id, byId.id));
        }
        updated++;
        continue;
      }
      if (byId) {
        console.warn(
          `Game id ${id} is ${byId.name}, not ${g.name}; adding it with the next free id`,
        );
        id = null;
      }
    }

    const byName = await db.query.game.findFirst({
      where: eq(game.name, g.name),
    });
    if (byName) {
      if (nbaId != null && nbaId !== byName.id) {
        console.warn(
          byName.idSource === "site"
            ? `Game ${byName.id} ${byName.name} has NBA id ${nbaId}; left under its site number until it is renumbered`
            : `Game ${byName.id} ${byName.name} (id_source ${byName.idSource}) was sent with NBA id ${nbaId}; left as it is`,
        );
      }
      const tip = tipColumns(g);
      if (
        byName.live !== g.live ||
        (tip.tipAt &&
          (tip.tipAt !== byName.tipAt || tip.gameDate !== byName.gameDate))
      ) {
        await db
          .update(game)
          .set({ live: g.live, ...tip })
          .where(eq(game.id, byName.id));
      }
      updated++;
      continue;
    }

    const inserted = await db
      .insert(game)
      .values({
        // the NBA id when there is one, else the next free id, a site number
        ...(id != null
          ? { id, idSource: "nba" as const }
          : { idSource: "site" as const }),
        name: g.name,
        // the teams and day as columns, so nothing has to read them from the name
        ...gameColumnsFromName(g.name),
        // with tipUtc, the tip-off and its Eastern day, over the name's day
        ...tipColumns(g),
        createdAt: new Date(g.createdAt).toISOString(),
        seasonName: g.seasonName,
        live: g.live,
      })
      .onConflictDoNothing()
      .returning({ id: game.id });
    if (inserted.length > 0) created++;
  }

  if (created > 0 || updated > 0) {
    console.log(`Games: ${created} added, ${updated} updated`);
  }
  return { created, updated };
}
