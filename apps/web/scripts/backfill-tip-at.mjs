// Fills game.tip_at (migration 0006) for games whose names carry a tip-off.
// From 2022/23 on, a name's time is the tip-off in US Eastern wall-clock
// written with a Z ("T19:30:00Z" is 7:30pm Eastern); it is turned into the real
// UTC instant here, DST included. A midnight time means the tip-off isn't
// known, so those games stay null, as do games that already have a tip_at.
// 2026/27 games are checked against the NBA schedule CSV.
//
// Dry run by default; --apply writes, in one transaction. --apply refuses when
// a 2026/27 game disagrees with the CSV, unless --allow-mismatches is given.
//
//   node --env-file=.env scripts/backfill-tip-at.mjs [--apply] [--allow-mismatches] [--csv <path>]
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
import { easternToUtc, nameWallClock } from "./eastern-time.mjs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const allowMismatches = args.includes("--allow-mismatches");
const csvAt = args.indexOf("--csv");
const csvPath =
  csvAt >= 0
    ? args[csvAt + 1]
    : path.join(
        homedir(),
        "Documents/Sandbox/tools/game-ids/2026-27-games.csv",
      );
const CHECKED_SEASON = "2026/27";

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL is not set");
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
console.log(`${apply ? "APPLY" : "DRY RUN"} against ${new URL(url).host}`);

// Preconditions: migration 0006 is in, and the game table looks as expected
const migrated = await db.execute(
  "SELECT 1 FROM _migrations WHERE name = '0006_game_tip_at.sql'",
);
if (migrated.rows.length === 0) {
  throw new Error("0006_game_tip_at.sql is not in _migrations; migrate first");
}
const columns = new Set(
  (await db.execute("PRAGMA table_info(game)")).rows.map((r) => String(r.name)),
);
for (const c of ["id", "name", "season_name", "game_date", "tip_at"]) {
  if (!columns.has(c)) throw new Error(`game has no ${c} column`);
}

/** @type {Map<number, { home: string, away: string, dateEt: string, tipUtc: string }>} */
const schedule = new Map();
if (csvPath && existsSync(csvPath)) {
  const [header = "", ...lines] = readFileSync(csvPath, "utf8")
    .trim()
    .split(/\r?\n/);
  const cols = header.split(",");
  const at = (/** @type {string} */ c) => {
    const i = cols.indexOf(c);
    if (i < 0) throw new Error(`${csvPath} has no ${c} column`);
    return i;
  };
  const [iId, iDate, iHome, iAway, iTip] = [
    at("nba_game_id"),
    at("date_et"),
    at("home"),
    at("away"),
    at("tip_utc"),
  ];
  for (const line of lines) {
    const f = line.split(",");
    schedule.set(Number.parseInt(f[iId] ?? "", 10), {
      dateEt: f[iDate] ?? "",
      home: f[iHome] ?? "",
      away: f[iAway] ?? "",
      tipUtc: f[iTip] ? new Date(f[iTip]).toISOString() : "",
    });
  }
  console.log(`${schedule.size} games in ${csvPath}`);
} else {
  console.warn(`No CSV at ${csvPath}; ${CHECKED_SEASON} is not cross-checked`);
}

const { rows } = await db.execute(
  "SELECT id, name, season_name, game_date, tip_at FROM game ORDER BY season_name, id",
);

/** @type {Map<string, { games: number, timed: number, unknown: number, alreadySet: number, toWrite: number, dayDiffers: number }>} */
const bySeason = new Map();
/** @type {{ id: number, tipAt: string }[]} */
const updates = [];
/** @type {string[]} */
const mismatches = [];
/** @type {string[]} */
const notInCsv = [];
/** @type {string[]} */
const dayNotes = [];

for (const r of rows) {
  const season = String(r.season_name ?? "(none)");
  const s = bySeason.get(season) ?? {
    games: 0,
    timed: 0,
    unknown: 0,
    alreadySet: 0,
    toWrite: 0,
    dayDiffers: 0,
  };
  bySeason.set(season, s);
  s.games++;

  const id = Number(r.id);
  const name = String(r.name);
  const wall = nameWallClock(name);
  if (!wall) {
    s.unknown++;
    continue;
  }
  const tipAt = easternToUtc(wall.day, wall.time);
  if (!tipAt) {
    s.unknown++;
    continue;
  }
  s.timed++;

  if (season === CHECKED_SEASON && schedule.size > 0) {
    const nba = schedule.get(id);
    if (!nba) {
      notInCsv.push(`${id} ${name}`);
    } else {
      const problems = [];
      if (nba.tipUtc !== tipAt)
        problems.push(`tip ${tipAt} vs CSV ${nba.tipUtc}`);
      if (nba.home !== wall.home || nba.away !== wall.away) {
        problems.push(
          `teams ${wall.home}/${wall.away} vs CSV ${nba.home}/${nba.away}`,
        );
      }
      if (nba.dateEt !== wall.day)
        problems.push(`day ${wall.day} vs CSV ${nba.dateEt}`);
      if (problems.length)
        mismatches.push(`${id} ${name}: ${problems.join("; ")}`);
    }
  }

  const easternDay = new Date(tipAt).toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  if (r.game_date !== easternDay) {
    s.dayDiffers++;
    dayNotes.push(
      `${id} ${name}: game_date ${String(r.game_date)}, tip day ${easternDay}`,
    );
  }

  if (r.tip_at != null) {
    s.alreadySet++;
    if (r.tip_at !== tipAt) {
      dayNotes.push(
        `${id} ${name}: tip_at already ${String(r.tip_at)}, name gives ${tipAt}; left as it is`,
      );
    }
    continue;
  }
  s.toWrite++;
  updates.push({ id, tipAt });
}

console.log(
  "\nBy season (games / with a time / unknown / already set / to write / game_date differs):",
);
console.table(Object.fromEntries(bySeason));
console.log(`Total to write: ${updates.length}`);
for (const u of updates.slice(0, 5))
  console.log(`  e.g. ${u.id} -> ${u.tipAt}`);

if (dayNotes.length) {
  console.log(
    `\n${dayNotes.length} notes (game_date not the tip-off's Eastern day, or tip_at already different):`,
  );
  for (const n of dayNotes.slice(0, 50)) console.log(`  ${n}`);
}
if (schedule.size > 0) {
  console.log(
    `\n${CHECKED_SEASON} against the CSV: ${mismatches.length} mismatches, ${notInCsv.length} games with a time not in the CSV`,
  );
  for (const m of mismatches) console.log(`  MISMATCH ${m}`);
  for (const m of notInCsv) console.log(`  not in CSV: ${m}`);
}

if (!apply) {
  console.log("\nDry run: nothing written. Add --apply to write.");
} else if (mismatches.length > 0 && !allowMismatches) {
  console.error(
    `\nRefusing to apply: ${mismatches.length} mismatches with the CSV. Fix them, or add --allow-mismatches.`,
  );
  process.exitCode = 1;
} else {
  // one batch is one transaction: every row or none
  const results = await db.batch(
    updates.map((u) => ({
      sql: "UPDATE game SET tip_at = ? WHERE id = ? AND tip_at IS NULL",
      args: [u.tipAt, u.id],
    })),
    "write",
  );
  const written = results.reduce((n, r) => n + r.rowsAffected, 0);
  console.log(`\nWrote tip_at on ${written} games.`);
}
db.close();
