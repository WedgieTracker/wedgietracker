-- The game's real tip-off, an ISO UTC instant ("2026-11-15T01:00:00.000Z"),
-- sent by the game sync as tipUtc. Null when unknown: older games, and games
-- the sync hasn't sent a tip-off for. game_date stays the US Eastern day.
-- scripts/backfill-tip-at.mjs fills it for games whose names carry a time.
ALTER TABLE game ADD COLUMN tip_at text;
