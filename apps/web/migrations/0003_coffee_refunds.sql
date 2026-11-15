-- When Apple refunded or revoked a coffee. The row stays, so the same purchase
-- sent again can't be counted again; a reversed refund sets this back to null.
ALTER TABLE coffee_checkout ADD COLUMN refunded_at text;
