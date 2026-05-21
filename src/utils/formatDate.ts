/** Rendered in place of a date for GEMS wedgies, which have no real game date. */
export const GEMS_EMOJI = "💎💎💎";

/**
 * GEMS wedgies have no real game date and are stored with an epoch-ish
 * placeholder (~1969-12-31). Detect via the UTC year so the check is
 * timezone-independent — comparing a locale-formatted string drifts across
 * zones (e.g. "31.12.69" vs "01.01.70") and lets the 1969 date leak through.
 */
export function isGemsDate(date: Date): boolean {
  return date.getUTCFullYear() < 2000;
}

export function formatDate(date: Date): string {
  if (isGemsDate(date)) {
    return GEMS_EMOJI;
  }
  return date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
}
