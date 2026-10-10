import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

/** Indexation bloquée tant que SITE.INDEXING_ENABLED vaut false (voir data/site.ts) */
export default function robots(): MetadataRoute.Robots {
  if (!SITE.INDEXING_ENABLED) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/rendez-vous/gestion/", "/teleconsultation/"] }],
    sitemap: `${SITE.SITE_URL}/sitemap.xml`,
    host: SITE.SITE_URL,
  };
}
