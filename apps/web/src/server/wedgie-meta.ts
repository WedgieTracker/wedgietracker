import { and, eq, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { wedgie } from "@wedgietracker/core/schema";
import { db } from "~/server/db";
import { CACHE_TAGS } from "~/server/cache";

/** One wedgie, with what its page title and description need. */
export async function getWedgieForMeta(seasonName: string, number: number) {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  return (
    (await db.query.wedgie.findFirst({
      where: and(eq(wedgie.seasonName, seasonName), eq(wedgie.number, number)),
      columns: {
        number: true,
        seasonName: true,
        playerName: true,
        teamName: true,
        teamAgainstName: true,
        wedgieDate: true,
        videoUrl: true,
      },
      with: { wedgieToTypes: { with: { type: { columns: { name: true } } } } },
    })) ?? null
  );
}

/** Every wedgie's address and last change, for the sitemap (GEMS left out). */
export async function getWedgiesForSitemap() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  return db
    .select({
      seasonName: wedgie.seasonName,
      number: wedgie.number,
      updatedAt: wedgie.updatedAt,
    })
    .from(wedgie)
    .where(ne(wedgie.seasonName, "GEMS"));
}
