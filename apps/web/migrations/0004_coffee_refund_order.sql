-- The signedDate (ms) of the newest App Store refund, revocation or reversal
-- applied to a purchase. A notification only changes the purchase if it is
-- newer than this, so an old refund Apple sends again after a reversal can't
-- take the coffees off a second time. Null until the first one arrives.
ALTER TABLE coffee_checkout ADD COLUMN refund_changed_at integer;
