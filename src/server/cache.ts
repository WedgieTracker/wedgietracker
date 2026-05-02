import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  WEDGIE_DATA: "wedgie-data",
  STORE_DATA: "store-data",
  BLOG_DATA: "blog-data",
} as const;

export function invalidateWedgieData() {
  // Single-arg form: blocks the next request to refetch fresh data instead of
  // serving stale via SWR. Deprecated but the only Route-Handler-callable API
  // that gives read-your-own-writes for the live wedgie counter.
  revalidateTag(CACHE_TAGS.WEDGIE_DATA);
}

export function invalidateStoreData() {
  revalidateTag(CACHE_TAGS.STORE_DATA, "max");
}
