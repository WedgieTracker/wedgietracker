// Reports wedgies that disagree with their game, and games whose name and
// columns disagree. Read-only: everything runs in a read transaction, nothing
// is changed. Exits with 1 when it finds a problem, so it can gate a deploy.
// Also counts games by id_source and lists the 'derived' and 'site' ones,
// which are not problems.
// Run with: pnpm db:check-games (add -- --all to list every row, not the first 20)
//
// A game's name is "HOME @ AWAY - <tip>", home team first; home_team,
// away_team and game_date (the US Eastern day) are its columns. A wedgie is
// fine when it points at a game by game_id, its game_name is that game's name,
// its team and opponent are the game's two teams in either order (All-Star
// games and GEMS aside) and its date falls on the game's day. The rules match
// packages/core/src/utils/game.ts.
import { createClient } from "@libsql/client";

const ALL_STAR = new Set(["STARS", "EST", "WST"]);
const NAME = /^(.+?) @ (.+?) - (\d{4}-\d{2}-\d{2})(?:T(.*))?$/;
const showAll = process.argv.includes("--all");
const LIMIT = 20;

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function easternDay(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

// Noon UTC on the Eastern day, the tip in Eastern time written as UTC, or a
// real UTC time: the first two keep the Eastern day as their UTC day, the last
// has it in Eastern time, so either day counts.
function onGameDay(wedgieDate, gameDate) {
  const d = new Date(wedgieDate);
  if (Number.isNaN(d.getTime())) return false;
  return wedgieDate.slice(0, 10) === gameDate || easternDay(d) === gameDate;
}

const tx = await db.transaction("read");
let games;
let wedgies;
try {
  // id_source arrives with migration 0005; before it every game reads as nba
  const hasIdSource =
    (
      await tx.execute(
        "SELECT 1 FROM pragma_table_info('game') WHERE name = 'id_source'",
      )
    ).rows.length > 0;
  games = (
    await tx.execute(
      `SELECT id, name, home_team, away_team, game_date, season_name,
              ${hasIdSource ? "id_source" : "'nba' AS id_source"}
         FROM game ORDER BY id`,
    )
  ).rows;
  wedgies = (
    await tx.execute(
      `SELECT id, season_name, number, team_name, team_against_name, wedgie_date,
              game_name, game_id
         FROM wedgie
        ORDER BY season_name, number`,
    )
  ).rows;
} finally {
  tx.close();
}

const problems = { games: [], wedgies: [] };
const gamesById = new Map();

for (const g of games) {
  gamesById.set(Number(g.id), g);
  const m = NAME.exec(String(g.name));
  const issues = [];
  if (!g.home_team || !g.away_team || !g.game_date) {
    issues.push("teams or day missing");
  }
  if (!m) {
    issues.push("name is not HOME @ AWAY - <date>");
  } else if (
    m[1] !== g.home_team ||
    m[2] !== g.away_team ||
    m[3] !== g.game_date
  ) {
    issues.push(
      `name says ${m[1]} home to ${m[2]} on ${m[3]}, columns say ${g.home_team} home to ${g.away_team} on ${g.game_date}`,
    );
  }
  if (g.home_team && g.home_team === g.away_team) {
    issues.push("home and away are the same team");
  }
  if (issues.length > 0) {
    problems.games.push(`game ${g.id} "${g.name}": ${issues.join("; ")}`);
  }
}

for (const w of wedgies) {
  const who = `wedgie ${w.season_name} #${w.number} (id ${w.id})`;
  const issues = [];
  if (w.season_name === "GEMS") {
    if (w.game_id != null) issues.push(`GEMS wedgie on game ${w.game_id}`);
  } else if (w.game_id == null) {
    issues.push(
      w.game_name
        ? `no game_id; game_name "${w.game_name}" matches no game`
        : "no game",
    );
  } else {
    const g = gamesById.get(Number(w.game_id));
    if (!g) {
      issues.push(`game_id ${w.game_id} is not a game`);
    } else {
      const label = `${g.away_team} @ ${g.home_team} on ${g.game_date}`;
      if (w.game_name !== g.name) {
        issues.push(
          `game_name "${w.game_name}" is not its game's name "${g.name}"`,
        );
      }
      const allStar = [
        w.team_name,
        w.team_against_name,
        g.home_team,
        g.away_team,
      ].some((t) => ALL_STAR.has(t));
      const teamsMatch =
        (w.team_name === g.home_team && w.team_against_name === g.away_team) ||
        (w.team_name === g.away_team && w.team_against_name === g.home_team);
      if (!allStar && !teamsMatch) {
        issues.push(
          `${w.team_name} v ${w.team_against_name} did not play ${label}`,
        );
      }
      if (g.game_date && !onGameDay(String(w.wedgie_date), g.game_date)) {
        issues.push(`dated ${w.wedgie_date}, not the day of ${label}`);
      }
    }
  }
  if (issues.length > 0) problems.wedgies.push(`${who}: ${issues.join("; ")}`);
}

function report(title, rows) {
  console.log(`\n${title}: ${rows.length}`);
  for (const r of showAll ? rows : rows.slice(0, LIMIT)) console.log(`  ${r}`);
  if (!showAll && rows.length > LIMIT) {
    console.log(`  ... and ${rows.length - LIMIT} more (run with --all)`);
  }
}

console.log(`Checked ${games.length} games and ${wedgies.length} wedgies.`);

const bySource = new Map();
for (const g of games) {
  const source = String(g.id_source);
  if (!bySource.has(source)) bySource.set(source, []);
  bySource.get(source).push(g);
}
console.log("\nGames by id_source:");
for (const source of ["nba", "derived", "site"]) {
  console.log(`  ${source}: ${bySource.get(source)?.length ?? 0}`);
}
for (const [source, rows] of bySource) {
  if (!["nba", "derived", "site"].includes(source)) {
    problems.games.push(`${rows.length} games have id_source "${source}"`);
  }
}
report(
  "Games with a derived id",
  (bySource.get("derived") ?? []).map(
    (g) => `game ${g.id} (${g.season_name}) "${g.name}"`,
  ),
);
report(
  "Games with a site number",
  (bySource.get("site") ?? []).map(
    (g) => `game ${g.id} (${g.season_name}) "${g.name}"`,
  ),
);
report("Games whose name and columns disagree", problems.games);
report("Wedgies that disagree with their game", problems.wedgies);

const total = problems.games.length + problems.wedgies.length;
console.log(total === 0 ? "\nAll consistent." : `\n${total} problems.`);
process.exitCode = total === 0 ? 0 : 1;
