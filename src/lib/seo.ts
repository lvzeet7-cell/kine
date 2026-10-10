import type { Metadata } from "next";
import { SITE, isSet } from "@/data/site";
import { images } from "@/data/images";

/** Nom affiché dans les titres (repli générique tant que le nom n'est pas renseigné) */
export const siteName = isSet(SITE.CABINET_NAME) ? SITE.CABINET_NAME : "Cabinet de kinésithérapie";
export const cityLabel = isSet(SITE.CITY) ? SITE.CITY : "[VILLE]";

/** Métadonnées d'une page : title, description, canonical, Open Graph */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const ogImage = images.og ? [{ url: images.og, width: 1200, height: 630 }] : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName,
      title,
      description,
      url: path,
      ...(ogImage ? { images: ogImage } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
