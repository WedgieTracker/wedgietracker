import { CACHE_TAGS } from "~/server/cache";

/**
 * Public, input-free queries that every visitor (and every TRMNL install) reads. Vercel's CDN
 * serves them without invoking the function, so polling traffic on these paths costs nothing.
 *
 * Every procedure here must return the same data for every caller: no session, header or
 * cookie dependent branches.
 */
export const CDN_CACHEABLE_PATHS: ReadonlySet<string> = new Set([
  "wedgie.getStats",
  "wedgie.getTopStandings",
  "wedgie.getLatestWedgies",
  "wedgie.getTotalWedgies",
  "admin.getGlobal",
]);

/**
 * Only Vercel's CDN reads this header; it is stripped before the response reaches the browser,
 * so `Cache-Control` keeps Vercel's default (`public, max-age=0, must-revalidate`) and browsers
 * never cache these responses.
 *
 * The data only changes when the admin panel or the Raspberry Pi writes, and every write path
 * calls `invalidateWedgieData()`, which purges the `wedgie-data` tag from the CDN as well as from
 * Next's cache. The TTL is therefore a safety net for a missed purge: fresh for an hour, then
 * served stale while one background revalidation per region refreshes it.
 */
export const CDN_CACHE_CONTROL =
  "public, max-age=3600, stale-while-revalidate=86400";

export const CDN_CACHE_TAG = CACHE_TAGS.WEDGIE_DATA;

export interface CdnCacheMetaInput {
  type: "query" | "mutation" | "subscription" | "unknown";
  paths: readonly string[] | undefined;
  errors: readonly unknown[];
  /**
   * tRPC sets this when the response is streamed (`httpBatchStreamLink`, `trpc-accept:
   * application/jsonl`). Headers are then written before any procedure has run, so `errors` is
   * always empty and a failed call would be cached as a 200.
   */
  eagerGeneration: boolean;
}

export function isCdnCacheable({
  type,
  paths,
  errors,
  eagerGeneration,
}: CdnCacheMetaInput): boolean {
  return (
    type === "query" &&
    !eagerGeneration &&
    errors.length === 0 &&
    paths !== undefined &&
    paths.length > 0 &&
    paths.every((path) => CDN_CACHEABLE_PATHS.has(path))
  );
}

/** `responseMeta` for tRPC's fetch adapter. */
export function cdnCacheResponseMeta(input: CdnCacheMetaInput): {
  headers?: Headers;
} {
  if (!isCdnCacheable(input)) return {};
  return {
    headers: new Headers({
      "Vercel-CDN-Cache-Control": CDN_CACHE_CONTROL,
      "Vercel-Cache-Tag": CDN_CACHE_TAG,
    }),
  };
}
