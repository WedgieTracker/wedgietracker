-- The coffee leaderboard: a name the buyer chose (shown once approved), its
-- approval status, and a key that groups one buyer's coffees without storing
-- their email. All null on the coffees bought before the leaderboard.
ALTER TABLE coffee_checkout ADD COLUMN display_name text;
ALTER TABLE coffee_checkout ADD COLUMN name_status text;
ALTER TABLE coffee_checkout ADD COLUMN donor_key text;
