import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";

function parse(value: Date | string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Day and month in the phone's own order and separator: 09/11 in the UK,
 * 11/09 in the US, 09.11. in Germany. GEMS wedgies have no real date.
 */
export function shortDate(value: Date | string): string {
  const date = parse(value);
  if (!date) return "";
  if (isGemsDate(date)) return GEMS_EMOJI;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * The night of the wedgie with its weekday, in the phone's own format:
 * "Fri 13 Nov 2026" in the UK, "Fri, Nov 13, 2026" in the US.
 */
export function nightDate(value: Date | string): string {
  const date = parse(value);
  if (!date) return "";
  if (isGemsDate(date)) return GEMS_EMOJI;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
