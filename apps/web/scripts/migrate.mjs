// Applies each SQL file in ../migrations once, in name order, and records it
// in _migrations. Run with: pnpm db:sql-migrate
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await db.execute(
  "CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY NOT NULL, applied_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL)",
);
const done = new Set(
  (await db.execute("SELECT name FROM _migrations")).rows.map((r) => r.name),
);

for (const name of (await readdir(dir))
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  if (done.has(name)) continue;
  const statements = (await readFile(dir + name, "utf8"))
    .split(/;\s*$/m)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  await db.batch(
    [
      ...statements,
      { sql: "INSERT INTO _migrations (name) VALUES (?)", args: [name] },
    ],
    "write",
  );
  console.log(`applied ${name}`);
}
console.log("migrations up to date");
