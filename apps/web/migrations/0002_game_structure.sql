-- A game's teams and day as their own columns, so nothing has to read them out
-- of game.name ("HOME @ AWAY - <tip>", home team first, the reverse of NBA
-- notation). game_date is the US Eastern calendar day, YYYY-MM-DD, which is the
-- date written in the name (tips are Eastern local time written as UTC, older
-- games are midnight on their Eastern day).
ALTER TABLE game ADD COLUMN home_team text;
ALTER TABLE game ADD COLUMN away_team text;
ALTER TABLE game ADD COLUMN game_date text;
UPDATE game
SET
  home_team = substr(name, 1, instr(name, ' @ ') - 1),
  away_team = substr(name, instr(name, ' @ ') + 3, instr(name, ' - ') - instr(name, ' @ ') - 3),
  game_date = substr(name, instr(name, ' - ') + 3, 10)
WHERE instr(name, ' @ ') > 1
  AND instr(name, ' - ') > instr(name, ' @ ') + 3
  AND substr(name, instr(name, ' - ') + 3, 10) GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]';
CREATE INDEX game_home_team_away_team_idx ON game (home_team, away_team);
CREATE INDEX game_game_date_idx ON game (game_date);
-- Wedgies point at their game by id instead of by the name text, so fixing a
-- game's details no longer means renaming it on every wedgie. GEMS wedgies have
-- no game and keep a null game_id.
ALTER TABLE wedgie ADD COLUMN game_id integer REFERENCES game(id) ON DELETE SET NULL;
UPDATE wedgie
SET game_id = (SELECT game.id FROM game WHERE game.name = wedgie.game_name)
WHERE game_name IS NOT NULL AND game_name <> '';
CREATE INDEX wedgie_game_id_idx ON wedgie (game_id);
