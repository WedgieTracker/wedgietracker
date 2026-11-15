-- Where a game's id comes from. 'nba' is the NBA's own game id (0022600150 is
-- stored as 22600150), 'derived' is worked out from the NBA's numbering
-- pattern where the NBA id isn't published, and 'site' is a number the site
-- gave the game because no NBA id was known. Everything is 'nba' unless marked.
ALTER TABLE game ADD COLUMN id_source text NOT NULL DEFAULT 'nba';
-- The small ids handed out one after another before games kept their NBA id.
UPDATE game SET id_source = 'site' WHERE id < 10000000;
-- Games numbered on from the 2023/24 play-in ids (52300101 to 52300211, real
-- NBA ids) in 2025/26 and 2026/27. They look like NBA ids but aren't.
UPDATE game
SET id_source = 'site'
WHERE season_name IN ('2025/26', '2026/27')
  AND id BETWEEN 52300000 AND 52399999;
