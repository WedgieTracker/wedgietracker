import { and, eq, or } from "drizzle-orm";
import { game } from "@wedgietracker/core/schema";
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
