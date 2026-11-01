import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { desc } from "drizzle-orm";
import { wedgie } from "@wedgietracker/core/schema";
import { db } from "~/server/db";
import { CACHE_TAGS } from "~/server/cache";
import { APP_URL } from "~/config/metadata";
import { getWedgiesForSitemap } from "~/server/wedgie-meta";
import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";

// The public pages. Left out: /privacy (noindex), /blog and /store (they redirect), the
// thank-you pages, /admin and the API. Then every wedgie's own link, which has its own title,
// description and canonical address (see app/all-wedgies/page.tsx).
const PAGES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /** Changes with every new wedgie */
  live: boolean;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1, live: true },
  { path: "/all-wedgies", changeFrequency: "daily", priority: 0.9, live: true },
  { path: "/standings", changeFrequency: "daily", priority: 0.8, live: true },
  {
    path: "/stats-for-nerds",
    changeFrequency: "daily",
    priority: 0.7,
    live: true,
  },
  {
    path: "/stats-for-nerds/pace",
    changeFrequency: "weekly",
    priority: 0.6,
    live: true,
  },
  {
    path: "/seasons-history",
    changeFrequency: "weekly",
    priority: 0.6,
    live: true,
  },
  { path: "/history", changeFrequency: "monthly", priority: 0.4, live: false },
  { path: "/support", changeFrequency: "monthly", priority: 0.3, live: false },
  {
    path: "/support-us",
    changeFrequency: "monthly",
    priority: 0.3,
    live: false,
  },
];

/** When the wedgie data last changed, so the live pages carry a real lastModified. */
async function lastWedgieChange() {
  "use cache";
  cacheTag(CACHE_TAGS.WEDGIE_DATA);
  cacheLife({ revalidate: 3600 });

  const latest = await db.query.wedgie.findFirst({
    orderBy: desc(wedgie.updatedAt),
    columns: { updatedAt: true },
  });
  return latest?.updatedAt ? new Date(latest.updatedAt) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [changed, wedgies] = await Promise.all([
    lastWedgieChange(),
    getWedgiesForSitemap(),
  ]);
  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: `${APP_URL}${p.path}`,
    ...(p.live && changed && { lastModified: changed }),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
  const each: MetadataRoute.Sitemap = wedgies.map((w) => ({
    // Next writes <loc> as given, and a bare & breaks the XML (Search Console: parsing error)
    url: `${APP_URL}/all-wedgies?${buildAllWedgiesQuery({
      season: w.seasonName,
      wedgie: w.number,
    }).replaceAll("&", "&amp;")}`,
    lastModified: new Date(w.updatedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));
  return [...pages, ...each];
}
