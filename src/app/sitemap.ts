import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";
import { services } from "@/data/services";
import { nonConventionnes } from "@/data/non-conventionnes";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/rendez-vous", priority: 0.9 },
    { path: "/soins", priority: 0.9 },
    { path: "/soins-non-conventionnes", priority: 0.8 },
    { path: "/mon-bilan-prevention", priority: 0.8 },
    { path: "/cabinet", priority: 0.8 },
    { path: "/kinesitherapeute", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/deroulement", priority: 0.6 },
    { path: "/teleconsultation", priority: 0.6 },
    { path: "/faq", priority: 0.6 },
    ...services.map((s) => ({ path: `/soins/${s.slug}`, priority: 0.7 })),
    ...nonConventionnes.map((c) => ({ path: `/soins-non-conventionnes/${c.slug}`, priority: 0.6 })),
    { path: "/mentions-legales", priority: 0.2 },
    { path: "/confidentialite", priority: 0.2 },
    { path: "/cookies", priority: 0.2 },
  ];

  return pages.map((p) => ({
    url: `${SITE.SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p.priority,
  }));
}
