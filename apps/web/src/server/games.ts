import { and, eq, or } from "drizzle-orm";
import { game, wedgie } from "@wedgietracker/core/schema";
import { gameColumns, parseGameName } from "@wedgietracker/core/utils/game";
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

function tipOf(g: { name: string; gameDate?: string | null }) {
  const parsed = parseGameName(g.name);
  const day = g.gameDate ?? parsed?.gameDate;
  return day ? Date.parse(`${day}T${parsed?.tip ?? "00:00"}:00Z`) : NaN;
}

/**
 * The game a caller of the external API names. Games are named
 * "HOME @ AWAY - <tip>" with the tip in US Eastern time written as UTC; a
 * caller holding the real UTC tip-off finds the same game by its two teams and
 * the nearest tip within 12 hours. The teams may come in either order: the
 * same two teams never meet twice within 12 hours, so "AWAY @ HOME" (NBA
 * notation) finds the same game.
 */
export async function pickGame(db: typeof Db, name: string) {
  const exact = await db.query.game.findFirst({ where: eq(game.name, name) });
  if (exact) return exact;
  const wanted = parseGameName(name);
  if (!wanted) return undefined;
  const at = tipOf({ name });
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
    .map((g) => ({ g, gap: Math.abs(tipOf(g) - at) }))
    .filter((c) => c.gap <= 12 * 3600 * 1000)
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
 * day and live state. A new name is written onto the game's wedgies too, so
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
      .set({ name, ...columns, live: g.live })
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
      if (byName.live !== g.live) {
        await db
          .update(game)
          .set({ live: g.live })
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
