import { normalizeTwitterHandle, twitterProfileUrl } from "./twitterHandle";

/**
 * Shoutouts are X or Bluesky handles, kept in one list. A Bluesky handle is a domain name
 * ("name.bsky.social", "wedgietracker.com") and an X handle can never contain a dot, so the dot is
 * what tells them apart.
 */
const BLUESKY_PATTERN =
  /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** A valid stored shoutout: an X handle, or a Bluesky handle in lower case. */
export const SHOUTOUT_PATTERN =
  /^(?:[A-Za-z0-9_]{1,15}|(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?)$/;

export type ShoutoutNetwork = "x" | "bluesky";

export function shoutoutNetwork(handle: string): ShoutoutNetwork {
  return handle.includes(".") ? "bluesky" : "x";
}

export function shoutoutProfileUrl(handle: string) {
  return shoutoutNetwork(handle) === "bluesky"
    ? `https://bsky.app/profile/${handle}`
    : twitterProfileUrl(handle);
}

/**
 * Turns "@nodunks", an x.com profile URL, "@name.bsky.social" or a bsky.app profile URL into a
 * stored handle. Returns null when it is neither a valid X nor a valid Bluesky handle.
 */
export function normalizeShoutout(input: string): string | null {
  const value = input.trim();
  const bsky = /^(?:https?:\/\/)?(?:www\.)?bsky\.app\/profile\/([^/?#]+)/i.exec(
    value,
  );
  if (bsky) {
    const handle = bsky[1]!.toLowerCase();
    return BLUESKY_PATTERN.test(handle) ? handle : null;
  }
  const x = normalizeTwitterHandle(value);
  if (x) return x;
  const handle = value.replace(/^@/, "").toLowerCase();
  return BLUESKY_PATTERN.test(handle) ? handle : null;
}

/** Splits a comma- or whitespace-separated list into unique, valid shoutouts, keeping order. */
export function parseShoutouts(input: string): string[] {
  const seen = new Set<string>();
  const handles: string[] = [];
  for (const part of input.split(/[\s,]+/)) {
    const handle = normalizeShoutout(part);
    if (handle && !seen.has(handle.toLowerCase())) {
      seen.add(handle.toLowerCase());
      handles.push(handle);
    }
  }
  return handles;
}
