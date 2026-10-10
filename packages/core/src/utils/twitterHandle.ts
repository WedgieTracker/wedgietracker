const HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

/**
 * Turns "@nodunks", "nodunks", or a profile URL (x.com / twitter.com) into a bare handle.
 * Returns null when the input is not a valid X/Twitter username.
 */
export function normalizeTwitterHandle(input: string): string | null {
  let value = input.trim();
  const url =
    /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/([^/?#]+)/i.exec(
      value,
    );
  if (url) value = url[1]!;
  value = value.replace(/^@/, "");
  return HANDLE_PATTERN.test(value) ? value : null;
}

/** Splits a comma- or whitespace-separated list into unique, valid handles, keeping order. */
export function parseTwitterHandles(input: string): string[] {
  const seen = new Set<string>();
  const handles: string[] = [];
  for (const part of input.split(/[\s,]+/)) {
    const handle = normalizeTwitterHandle(part);
    if (handle && !seen.has(handle.toLowerCase())) {
      seen.add(handle.toLowerCase());
      handles.push(handle);
    }
  }
  return handles;
}

export function twitterProfileUrl(handle: string) {
  return `https://x.com/${handle}`;
}
