import { SITE, isAddressSet, isSet, telHref, type OpeningDay } from "@/data/site";
import { services } from "@/data/services";
import { siteName } from "./seo";

const SLOT_RE = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;

/**
 * Données structurées du cabinet (type Physiotherapy, sous-type de MedicalBusiness).
 * Seules les informations réellement renseignées sont publiées.
 */
export function localBusinessSchema(openingDays: OpeningDay[] = SITE.OPENING_HOURS): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Physiotherapy",
    "@id": `${SITE.SITE_URL}/#cabinet`,
    name: siteName,
    url: SITE.SITE_URL,
    knowsAbout: services.map((s) => s.title),
  };

  if (isSet(SITE.PHONE)) data.telephone = telHref(SITE.PHONE).replace("tel:", "");
  if (isSet(SITE.EMAIL)) data.email = SITE.EMAIL;
  if (isAddressSet()) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: [SITE.ADDRESS, SITE.ADDRESS_COMPLEMENT].filter(Boolean).join(", "),
      postalCode: SITE.POSTAL_CODE,
      addressLocality: SITE.CITY,
      addressCountry: "FR",
    };
  }
  if (typeof SITE.LATITUDE === "number" && typeof SITE.LONGITUDE === "number") {
    data.geo = { "@type": "GeoCoordinates", latitude: SITE.LATITUDE, longitude: SITE.LONGITUDE };
  }
  if (isSet(SITE.GOOGLE_MAPS_URL)) data.hasMap = SITE.GOOGLE_MAPS_URL;

  const hours = openingDays.flatMap((d) =>
    d.slots
      .map((s) => SLOT_RE.exec(s))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${d.schemaDay}`,
        opens: m[1],
        closes: m[2],
      })),
  );
  if (hours.length > 0) data.openingHoursSpecification = hours;

  const sameAs = [SITE.INSTAGRAM_URL, SITE.FACEBOOK_URL].filter((u) => isSet(u));
  if (sameAs.length > 0) data.sameAs = sameAs;

  if (isSet(SITE.PRACTITIONER_NAME)) {
    data.employee = { "@type": "Person", name: SITE.PRACTITIONER_NAME, jobTitle: SITE.PRACTITIONER_TITLE };
  }

  return data;
}
