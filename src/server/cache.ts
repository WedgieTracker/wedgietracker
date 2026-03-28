import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  WEDGIE_DATA: "wedgie-data",
  STORE_DATA: "store-data",
  BLOG_DATA: "blog-data",
} as const;

export function invalidateWedgieData() {
  revalidateTag(CACHE_TAGS.WEDGIE_DATA, "max");
}

export function invalidateStoreData() {
  revalidateTag(CACHE_TAGS.STORE_DATA, "max");
}
