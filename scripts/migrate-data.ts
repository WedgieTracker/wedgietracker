/**
 * One-time migration script: Neon (PostgreSQL) → Turso (SQLite/libSQL)
 *
 * Prerequisites:
 *   pnpm add -D pg @types/pg tsx
 *
 * Usage:
 *   NEON_DATABASE_URL="postgresql://..." \
 *   TURSO_DATABASE_URL="libsql://..." \
 *   TURSO_AUTH_TOKEN="..." \
 *   npx tsx scripts/migrate-data.ts
 *
 * This script:
 *   1. Reads all rows from the Neon PostgreSQL database
 *   2. Transforms data types (DateTime → ISO string, JSON → stringified)
 *   3. Inserts into the Turso database in dependency order
 */

import pg from "pg";
import { createClient } from "@libsql/client";

const { Client } = pg;

// ─── Config ──────────────────────────────────────────────────────────────────

const NEON_URL = process.env.NEON_DATABASE_URL;
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!NEON_URL || !TURSO_URL || !TURSO_TOKEN) {
  console.error(
    "Missing env vars. Required: NEON_DATABASE_URL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN",
  );
  process.exit(1);
}

const pgClient = new Client({ connectionString: NEON_URL });
const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toIso(date: Date | string | null): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

function jsonStr(val: unknown): string {
  if (typeof val === "string") return val;
  return JSON.stringify(val ?? {});
}

async function insertBatch(
  table: string,
  columns: string[],
  rows: unknown[][],
) {
  if (rows.length === 0) {
    console.log(`  [${table}] No rows to insert`);
    return;
  }

  const placeholders = columns.map(() => "?").join(", ");
  const sqlStr = `INSERT OR IGNORE INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`;

  // Use batch() in chunks of 100 for much faster inserts
  const CHUNK_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      await turso.batch(
        chunk.map((row) => ({ sql: sqlStr, args: row as any[] })),
        "write",
      );
      inserted += chunk.length;
    } catch (err) {
      // Fallback: try one-by-one for this chunk to identify bad rows
      for (const row of chunk) {
        try {
          await turso.execute({ sql: sqlStr, args: row as any[] });
          inserted++;
        } catch (rowErr) {
          console.error(`  [${table}] Error inserting row:`, row, rowErr);
        }
      }
    }
    if (i % 500 === 0 && i > 0) {
      console.log(`  [${table}] Progress: ${i}/${rows.length}...`);
    }
  }
  console.log(`  [${table}] Inserted ${inserted}/${rows.length} rows`);
}

// ─── Migration ───────────────────────────────────────────────────────────────

async function migrate() {
  await pgClient.connect();
  console.log("Connected to Neon PostgreSQL");

  // 1. Users
  console.log("\n1. Migrating User...");
  const users = await pgClient.query('SELECT * FROM "User"');
  await insertBatch(
    "user",
    ["id", "name", "email", "emailVerified", "image"],
    users.rows.map((r: any) => [
      r.id,
      r.name,
      r.email,
      r.emailVerified ? Math.floor(new Date(r.emailVerified).getTime() / 1000) : null,
      r.image,
    ]),
  );

  // 2. Accounts
  console.log("\n2. Migrating Account...");
  const accounts = await pgClient.query('SELECT * FROM "Account"');
  await insertBatch(
    "account",
    [
      "id", "userId", "type", "provider", "providerAccountId",
      "refresh_token", "access_token", "expires_at", "token_type",
      "scope", "id_token", "session_state", "refresh_token_expires_in",
    ],
    accounts.rows.map((r: any) => [
      r.id, r.userId, r.type, r.provider, r.providerAccountId,
      r.refresh_token, r.access_token, r.expires_at, r.token_type,
      r.scope, r.id_token, r.session_state, r.refresh_token_expires_in,
    ]),
  );

  // 3. Sessions
  console.log("\n3. Migrating Session...");
  const sessions = await pgClient.query('SELECT * FROM "Session"');
  await insertBatch(
    "session",
    ["id", "sessionToken", "userId", "expires"],
    sessions.rows.map((r: any) => [
      r.id,
      r.sessionToken,
      r.userId,
      r.expires ? Math.floor(new Date(r.expires).getTime() / 1000) : null,
    ]),
  );

  // 4. VerificationToken
  console.log("\n4. Migrating VerificationToken...");
  const tokens = await pgClient.query('SELECT * FROM "VerificationToken"');
  await insertBatch(
    "verificationToken",
    ["identifier", "token", "expires"],
    tokens.rows.map((r: any) => [
      r.identifier,
      r.token,
      r.expires ? Math.floor(new Date(r.expires).getTime() / 1000) : null,
    ]),
  );

  // 5. Player
  console.log("\n5. Migrating Player...");
  const players = await pgClient.query('SELECT * FROM "Player"');
  await insertBatch(
    "player",
    ["id", "name", "created_at", "updated_at"],
    players.rows.map((r: any) => [r.id, r.name, toIso(r.createdAt), toIso(r.updatedAt)]),
  );

  // 6. Team
  console.log("\n6. Migrating Team...");
  const teams = await pgClient.query('SELECT * FROM "Team"');
  await insertBatch(
    "team",
    ["id", "name", "created_at", "updated_at"],
    teams.rows.map((r: any) => [r.id, r.name, toIso(r.createdAt), toIso(r.updatedAt)]),
  );

  // 7. Type
  console.log("\n7. Migrating Type...");
  const types = await pgClient.query('SELECT * FROM "Type"');
  await insertBatch(
    "type",
    ["id", "name", "created_at", "updated_at"],
    types.rows.map((r: any) => [r.id, r.name, toIso(r.createdAt), toIso(r.updatedAt)]),
  );

  // 8. Season
  console.log("\n8. Migrating Season...");
  const seasons = await pgClient.query('SELECT * FROM "Season"');
  await insertBatch(
    "season",
    ["id", "name", "created_at", "updated_at", "total_games"],
    seasons.rows.map((r: any) => [
      r.id, r.name, toIso(r.createdAt), toIso(r.updatedAt), r.totalGames,
    ]),
  );

  // 9. Game
  console.log("\n9. Migrating Game...");
  const games = await pgClient.query('SELECT * FROM "Game"');
  await insertBatch(
    "game",
    ["id", "name", "created_at", "updated_at", "season_name", "live"],
    games.rows.map((r: any) => [
      r.id, r.name, toIso(r.createdAt), toIso(r.updatedAt), r.seasonName, r.live ? 1 : 0,
    ]),
  );

  // 10. Wedgie
  console.log("\n10. Migrating Wedgie...");
  const wedgies = await pgClient.query('SELECT * FROM "Wedgie"');
  await insertBatch(
    "wedgie",
    [
      "id", "video_url", "position", "wedgie_date", "created_at", "updated_at",
      "number", "team_name", "team_against_name", "player_name", "season_name", "game_name",
    ],
    wedgies.rows.map((r: any) => [
      r.id,
      jsonStr(r.videoUrl),
      jsonStr(r.position),
      toIso(r.wedgieDate),
      toIso(r.createdAt),
      toIso(r.updatedAt),
      r.number,
      r.teamName,
      r.teamAgainstName,
      r.playerName,
      r.seasonName,
      r.gameName,
    ]),
  );

  // 11. _TypeToWedgie → wedgie_to_type
  console.log("\n11. Migrating _TypeToWedgie → wedgie_to_type...");
  const typeToWedgie = await pgClient.query('SELECT * FROM "_TypeToWedgie"');
  await insertBatch(
    "wedgie_to_type",
    ["wedgie_id", "type_id"],
    typeToWedgie.rows.map((r: any) => [r.B, r.A]), // Prisma implicit m2m: A=Type, B=Wedgie
  );

  // 12. Global
  console.log("\n12. Migrating Global...");
  const globals = await pgClient.query('SELECT * FROM "Global"');
  await insertBatch(
    "global",
    [
      "id", "current_season_id", "current_total_wedgies", "current_total_games",
      "current_total_minutes", "current_total_fga", "current_total_poss",
      "pace", "simple_pace", "math_pace", "live_games",
    ],
    globals.rows.map((r: any) => [
      r.id, r.currentSeasonId, r.currentTotalWedgies, r.currentTotalGames,
      r.currentTotalMinutes, r.currentTotalFGA, r.currentTotalPoss,
      r.pace, r.simplePace, r.mathPace, r.liveGames ? 1 : 0,
    ]),
  );

  // 13. TshirtOrder
  console.log("\n13. Migrating TshirtOrder...");
  const orders = await pgClient.query('SELECT * FROM "TshirtOrder"');
  await insertBatch(
    "tshirt_order",
    [
      "id", "size", "color", "created_at", "updated_at",
      "customer_email", "shipping_address", "shipping_name",
      "stripe_session_id", "printful_order_id",
    ],
    orders.rows.map((r: any) => [
      r.id, r.size, r.color, toIso(r.createdAt), toIso(r.updatedAt),
      r.customerEmail, jsonStr(r.shippingAddress), r.shippingName,
      r.stripeSessionId, r.printfulOrderId,
    ]),
  );

  // Done
  await pgClient.end();
  console.log("\n✅ Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
