import type { MetadataRoute } from "next";
import { APP_URL } from "~/config/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
