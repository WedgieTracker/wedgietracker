import { and, eq, inArray, ne } from "drizzle-orm";
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

/** One wedgie in full for its own page, and whether the season has one either side of it. */
export async function getWedgieForPage(seasonName: string, number: number) {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const [found, neighbours] = await Promise.all([
    db.query.wedgie.findFirst({
      where: and(eq(wedgie.seasonName, seasonName), eq(wedgie.number, number)),
      with: { wedgieToTypes: { with: { type: { columns: { name: true } } } } },
    }),
    db
      .select({ number: wedgie.number })
      .from(wedgie)
      .where(
        and(
          eq(wedgie.seasonName, seasonName),
          inArray(wedgie.number, [number - 1, number + 1]),
        ),
      ),
  ]);
  if (!found) return null;

  const { wedgieToTypes, ...rest } = found;
  const has = (n: number) => neighbours.some((w) => w.number === n);
  return {
    wedgie: {
      ...rest,
      types: wedgieToTypes.map((t) => ({ name: t.type.name })),
    },
    previous: has(number - 1) ? number - 1 : null,
    next: has(number + 1) ? number + 1 : null,
  };
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
