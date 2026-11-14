// Adds the current season's paid coffee checkouts from Stripe to the season's
// coffees, once each (coffee_checkout makes it safe to run again).
// Run with: pnpm db:backfill-coffees
import { createClient } from "@libsql/client";
import Stripe from "stripe";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
  throw new Error(
    "Run the backfill with the live Stripe key; test payments never count.",
  );
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const season = (
  await db.execute(
    "SELECT s.name FROM global g JOIN season s ON s.id = g.current_season_id WHERE g.id = 1",
  )
).rows[0]?.name;
const year = Number(/^(\d{4})/.exec(String(season))?.[1]);
if (!season || !year) throw new Error("No current season with a year");
const since = Math.floor(Date.UTC(year, 6, 1) / 1000);

let added = 0;
for await (const s of stripe.checkout.sessions.list({
  created: { gte: since },
  status: "complete",
  limit: 100,
})) {
  if (
    !s.livemode ||
    s.metadata?.coffee !== "true" ||
    s.payment_status !== "paid"
  )
    continue;
  const coffees = Math.round((s.amount_subtotal ?? 0) / 100);
  if (coffees < 1) continue;
  const [inserted] = await db.batch(
    [
      {
        sql: "INSERT INTO coffee_checkout (session_id, season_name, coffees) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
        args: [s.id, season, coffees],
      },
    ],
    "write",
  );
  if (inserted.rowsAffected) {
    await db.execute({
      sql: "UPDATE season SET coffees = coffees + ? WHERE name = ?",
      args: [coffees, season],
    });
    added += coffees;
  }
}
const total = (
  await db.execute({
    sql: "SELECT coffees FROM season WHERE name = ?",
    args: [season],
  })
).rows[0]?.coffees;
console.log(`${season}: added ${added}, total ${total}`);
