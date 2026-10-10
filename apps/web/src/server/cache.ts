import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  WEDGIE_DATA: "wedgie-data",
  STORE_DATA: "store-data",
  BLOG_DATA: "blog-data",
} as const;

export function invalidateWedgieData() {
  // expire: 0 forces the next request to refetch instead of serving stale via
  // SWR — needed for read-your-own-writes on the live wedgie counter.
  //
  // On Vercel a tag purge also covers the CDN, so this deletes the edge copies
  // of the public tRPC responses that carry `Vercel-Cache-Tag: wedgie-data`
  // (see ~/server/api/cdn-cache.ts). Every write path must call this.
  revalidateTag(CACHE_TAGS.WEDGIE_DATA, { expire: 0 });
}

export function invalidateStoreData() {
  revalidateTag(CACHE_TAGS.STORE_DATA, "max");
}
