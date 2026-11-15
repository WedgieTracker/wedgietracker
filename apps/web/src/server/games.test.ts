// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@wedgietracker/core/schema";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { parseNbaGameId, syncIncomingGames } from "./games";

// A real SQLite file, so ids, unique names and the wedgie links behave as on Turso.
const dbDir = mkdtempSync(path.join(tmpdir(), "wt-games-"));
const client = createClient({ url: `file:${dbDir}/test.db` });
const db = drizzle(client, { schema });

/** Runs a migration file the way scripts/migrate.mjs does. */
async function migrate(name: string, on = client) {
  const sql = readFileSync(
    path.join(__dirname, "../../migrations", name),
    "utf8",
  );
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  await on.batch(statements, "write");
}

async function games() {
  const { rows } = await client.execute(
    "SELECT id, name, home_team, away_team, game_date, live FROM game ORDER BY id",
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    home: r.home_team,
    away: r.away_team,
    date: r.game_date,
    live: Number(r.live),
  }));
}

/** Each game's id and where it comes from. */
async function idSources() {
  const { rows } = await client.execute(
    "SELECT id, id_source FROM game ORDER BY id",
  );
  return Object.fromEntries(rows.map((r) => [Number(r.id), r.id_source]));
}

async function wedgies() {
  const { rows } = await client.execute(
    "SELECT id, game_id, game_name FROM wedgie ORDER BY id",
  );
  return rows.map((r) => ({
    id: Number(r.id),
    gameId: r.game_id == null ? null : Number(r.game_id),
    gameName: r.game_name,
  }));
}

const sent = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  createdAt: "2026-11-09T00:30:00Z",
  seasonName: "2026-27",
  live: false,
  ...extra,
});

beforeAll(async () => {
  await client.batch(
    [
      `CREATE TABLE game (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name text NOT NULL UNIQUE,
        created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        updated_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        season_name text,
        live integer DEFAULT false NOT NULL
      )`,
      `CREATE TABLE wedgie (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        game_name text,
        updated_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
      )`,
    ],
    "write",
  );
  await migrate("0002_game_structure.sql");
  await migrate("0005_game_id_source.sql");
});

afterAll(() => {
  client.close();
  rmSync(dbDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await client.batch(
    [
      "DELETE FROM wedgie",
      "DELETE FROM game",
      "DELETE FROM sqlite_sequence",
      // an NBA-id game, and two older games with small site ids
      `INSERT INTO game (id, name, home_team, away_team, game_date, season_name, id_source)
       VALUES (21701091, 'HOU @ NOP - 2018-03-24T00:00:00.000Z', 'HOU', 'NOP', '2018-03-24', '2017-18', 'nba'),
              (1, 'BOS @ LAL - 2025-01-02T19:00:00Z', 'BOS', 'LAL', '2025-01-02', '2024-25', 'site'),
              (2, 'MIA @ CHI - 2025-01-03T19:00:00Z', 'MIA', 'CHI', '2025-01-03', '2024-25', 'site')`,
      `INSERT INTO wedgie (id, game_id, game_name)
       VALUES (1, 21701091, 'HOU @ NOP - 2018-03-24T00:00:00.000Z'),
              (2, 2, 'MIA @ CHI - 2025-01-03T19:00:00Z')`,
    ],
    "write",
  );
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("parseNbaGameId", () => {
  it("reads the NBA game id as a number", () => {
    expect(parseNbaGameId("0022600150")).toBe(22600150);
    expect(parseNbaGameId(" 0022600150 ")).toBe(22600150);
    expect(parseNbaGameId(22600150)).toBe(22600150);
  });

  it("is null for anything that isn't an id", () => {
    for (const value of [
      undefined,
      null,
      "",
      "0",
      0,
      -5,
      1.5,
      "00226-0150",
      "12345678901",
      "abc",
      {},
    ]) {
      expect(parseNbaGameId(value)).toBeNull();
    }
  });
});

describe("syncIncomingGames", () => {
  it("adds a new game under its NBA game id", async () => {
    const name = "NYK @ SAS - 2026-11-09T00:30:00Z";
    expect(
      await syncIncomingGames(db, [sent(name, { id: "0022600150" })]),
    ).toEqual({ created: 1, updated: 0 });
    expect(await games()).toContainEqual({
      id: 22600150,
      name,
      home: "NYK",
      away: "SAS",
      date: "2026-11-09",
      live: 0,
    });
  });

  it("takes the id as a number, or as gameId", async () => {
    await syncIncomingGames(db, [
      sent("NYK @ SAS - 2026-11-09T00:30:00Z", { id: 22600150 }),
      sent("DEN @ PHX - 2026-11-09T02:00:00Z", { gameId: "0022600151" }),
    ]);
    const ids = (await games()).map((g) => g.id);
    expect(ids).toContain(22600150);
    expect(ids).toContain(22600151);
  });

  it("adds a game sent without an id with the next free id, as before", async () => {
    const name = "NYK @ SAS - 2026-11-09T00:30:00Z";
    expect(await syncIncomingGames(db, [sent(name)])).toEqual({
      created: 1,
      updated: 0,
    });
    const added = (await games()).find((g) => g.name === name);
    expect(added?.id).toBe(21701092);
    expect(added?.home).toBe("NYK");
  });

  it("treats a repeat of a stored id as the same game and keeps its wedgies linked", async () => {
    // the same game again, now live and with its tip-off time
    const renamed = "HOU @ NOP - 2018-03-24T20:00:00Z";
    expect(
      await syncIncomingGames(db, [
        sent(renamed, { id: "0021701091", live: true }),
      ]),
    ).toEqual({ created: 0, updated: 1 });
    expect(await games()).toContainEqual({
      id: 21701091,
      name: renamed,
      home: "HOU",
      away: "NOP",
      date: "2018-03-24",
      live: 1,
    });
    expect((await games()).length).toBe(3);
    expect(await wedgies()).toContainEqual({
      id: 1,
      gameId: 21701091,
      gameName: renamed,
    });

    // sent again unchanged: still one row, nothing else moves
    await syncIncomingGames(db, [sent(renamed, { id: 21701091 })]);
    expect((await games()).length).toBe(3);
  });

  it("moves a postponed game to its new day under the same id", async () => {
    const moved = "HOU @ NOP - 2018-04-02T20:00:00Z";
    await syncIncomingGames(db, [sent(moved, { id: "0021701091" })]);
    const row = (await games()).find((g) => g.id === 21701091);
    expect(row?.date).toBe("2018-04-02");
    expect(row?.name).toBe(moved);
  });

  it("keeps an older game's small id when it is sent with its NBA id", async () => {
    // stored before games kept their NBA id
    const name = "BOS @ LAL - 2025-01-02T19:00:00Z";
    expect(
      await syncIncomingGames(db, [
        sent(name, { id: "0022400500", live: true }),
      ]),
    ).toEqual({ created: 0, updated: 1 });
    const rows = await games();
    expect(rows.find((g) => g.name === name)).toMatchObject({ id: 1, live: 1 });
    expect(rows.some((g) => g.id === 22400500)).toBe(false);
  });

  it("adds a game with the next free id when its NBA id belongs to a different game", async () => {
    // id 2 is MIA @ CHI; a different game arriving with id 2 must not overwrite it
    const name = "NYK @ SAS - 2026-11-09T00:30:00Z";
    expect(
      await syncIncomingGames(db, [sent(name, { id: "0000000002" })]),
    ).toEqual({
      created: 1,
      updated: 0,
    });
    const rows = await games();
    expect(rows.find((g) => g.id === 2)?.name).toBe(
      "MIA @ CHI - 2025-01-03T19:00:00Z",
    );
    expect(rows.find((g) => g.name === name)?.id).toBe(21701092);
    expect(await wedgies()).toContainEqual({
      id: 2,
      gameId: 2,
      gameName: "MIA @ CHI - 2025-01-03T19:00:00Z",
    });
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Game id 2 is MIA @ CHI"),
    );
  });

  it("never adds a game twice in one batch", async () => {
    const name = "NYK @ SAS - 2026-11-09T00:30:00Z";
    await syncIncomingGames(db, [
      sent(name, { id: "0022600150" }),
      sent(name, { id: "0022600150", live: true }),
    ]);
    const rows = (await games()).filter((g) => g.name === name);
    expect(rows).toEqual([expect.objectContaining({ id: 22600150, live: 1 })]);
  });

  describe("id_source", () => {
    it("marks a game added under its NBA id as nba", async () => {
      await syncIncomingGames(db, [
        sent("NYK @ SAS - 2026-11-09T00:30:00Z", { id: "0022600150" }),
      ]);
      expect((await idSources())[22600150]).toBe("nba");
    });

    it("marks a game added without an id as site", async () => {
      await syncIncomingGames(db, [sent("NYK @ SAS - 2026-11-09T00:30:00Z")]);
      expect((await idSources())[21701092]).toBe("site");
    });

    it("marks a game whose NBA id was taken as site", async () => {
      await syncIncomingGames(db, [
        sent("NYK @ SAS - 2026-11-09T00:30:00Z", { id: "0000000002" }),
      ]);
      const sources = await idSources();
      expect(sources[21701092]).toBe("site");
      expect(sources[2]).toBe("site");
    });

    it("logs a site game sent with its NBA id and leaves it under its site number", async () => {
      const name = "BOS @ LAL - 2025-01-02T19:00:00Z";
      await syncIncomingGames(db, [sent(name, { id: "0022400500" })]);
      expect(await idSources()).toEqual({
        1: "site",
        2: "site",
        21701091: "nba",
      });
      expect(await wedgies()).toContainEqual({
        id: 2,
        gameId: 2,
        gameName: "MIA @ CHI - 2025-01-03T19:00:00Z",
      });
      expect(console.warn).toHaveBeenCalledWith(
        "Game 1 BOS @ LAL - 2025-01-02T19:00:00Z has NBA id 22400500; left under its site number until it is renumbered",
      );
    });

    it("keeps an nba game nba when it is sent again", async () => {
      await syncIncomingGames(db, [
        sent("HOU @ NOP - 2018-03-24T20:00:00Z", { id: "0021701091" }),
      ]);
      expect((await idSources())[21701091]).toBe("nba");
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("turns a derived game into nba when the NBA sends that id", async () => {
      await client.execute(
        "UPDATE game SET id_source = 'derived' WHERE id = 21701091",
      );
      await syncIncomingGames(db, [
        sent("HOU @ NOP - 2018-03-24T00:00:00.000Z", { id: "0021701091" }),
      ]);
      expect((await idSources())[21701091]).toBe("nba");
    });
  });
});

describe("0005_game_id_source.sql", () => {
  it("marks small ids and the 2025/26 and 2026/27 games in the 523 range as site", async () => {
    const other = createClient({ url: `file:${dbDir}/migration.db` });
    try {
      await other.execute(
        `CREATE TABLE game (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          name text NOT NULL UNIQUE,
          season_name text
        )`,
      );
      await other.execute(
        `INSERT INTO game (id, name, season_name) VALUES
          (243, 'a', '2024/25'),
          (9999999, 'b', '2025/26'),
          (21701091, 'c', '2017/18'),
          (52300101, 'd', '2023/24'),
          (52300211, 'e', '2023/24'),
          (52300212, 'f', '2025/26'),
          (52300616, 'g', '2026/27'),
          (22600150, 'h', '2026/27')`,
      );
      await migrate("0005_game_id_source.sql", other);
      const { rows } = await other.execute(
        "SELECT id, id_source FROM game ORDER BY id",
      );
      expect(
        Object.fromEntries(rows.map((r) => [Number(r.id), r.id_source])),
      ).toEqual({
        243: "site",
        9999999: "site",
        21701091: "nba",
        22600150: "nba",
        52300101: "nba",
        52300211: "nba",
        52300212: "site",
        52300616: "site",
      });
    } finally {
      other.close();
    }
  });
});
