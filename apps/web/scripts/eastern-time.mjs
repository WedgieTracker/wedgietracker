// US Eastern wall-clock time to UTC, for scripts/backfill-tip-at.mjs. Plain
// JavaScript so the script runs under node without a build.

const ZONE = "America/New_York";

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * How far Eastern time is from UTC at an instant, in milliseconds: -4 hours
 * in summer (EDT), -5 in winter (EST).
 * @param {number} ms
 */
function easternOffset(ms) {
  /** @type {Record<string, number>} */
  const p = {};
  for (const { type, value } of parts.formatToParts(new Date(ms))) {
    if (type !== "literal") p[type] = Number(value);
  }
  const asUtc = Date.UTC(
    p.year ?? 0,
    (p.month ?? 1) - 1,
    p.day ?? 1,
    p.hour ?? 0,
    p.minute ?? 0,
    p.second ?? 0,
  );
  return asUtc - (ms - (ms % 1000));
}

/**
 * The UTC instant of a US Eastern wall-clock time, DST included:
 * ("2026-11-14", "20:00") is "2026-11-15T01:00:00.000Z". Null when the day or
 * time isn't one.
 * @param {string} day YYYY-MM-DD
 * @param {string} time HH:MM or HH:MM:SS
 * @returns {string | null}
 */
export function easternToUtc(day, time) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  const t = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!d || !t) return null;
  const [y, mo, da] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [h, mi, s] = [Number(t[1]), Number(t[2]), Number(t[3] ?? 0)];
  if (h > 23 || mi > 59 || s > 59) return null;
  const wall = Date.UTC(y, mo - 1, da, h, mi, s);
  const check = new Date(wall);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== da) return null;
  // the offset at a first guess, then again at the result, which settles it
  // across a DST change
  let utc = wall - easternOffset(wall);
  utc = wall - easternOffset(utc);
  return new Date(utc).toISOString();
}

/**
 * The US Eastern day and time a game name carries, "HOU @ NOP -
 * 2023-03-24T19:30:00Z" giving { day: "2023-03-24", time: "19:30:00" }. The
 * time is Eastern wall-clock written with a Z. Null when the name has no
 * time, or midnight, which means the tip-off isn't known.
 * @param {string} name
 * @returns {{ home: string, away: string, day: string, time: string } | null}
 */
export function nameWallClock(name) {
  const m =
    /^(.+?) @ (.+?) - (\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?Z?$/.exec(
      name,
    );
  if (!m) return null;
  const time = m[4] ?? "";
  if (/^00:00(:00)?$/.test(time)) return null;
  return { home: m[1] ?? "", away: m[2] ?? "", day: m[3] ?? "", time };
}
