-- The last approved leaderboard name of each purchase, so a changed name
-- can be shown for approval beside the one it replaces. Filled in for the
-- names approved so far.
ALTER TABLE coffee_checkout ADD COLUMN approved_name text;
UPDATE coffee_checkout SET approved_name = display_name WHERE name_status = 'approved';
