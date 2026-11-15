-- Coffees bought per season, and the Stripe checkouts already counted.
ALTER TABLE season ADD COLUMN coffees integer DEFAULT 0 NOT NULL;
CREATE TABLE coffee_checkout (
  session_id text PRIMARY KEY NOT NULL,
  season_name text NOT NULL,
  coffees integer NOT NULL,
  created_at text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
