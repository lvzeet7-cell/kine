/**
 * ============================================================================
 *  CONFIGURATION CENTRALE DU CABINET
 * ============================================================================
 *  Toutes les informations pratiques du site sont ici.
 *  Remplacez chaque valeur TODO ("[À RENSEIGNER]") par l'information réelle.
 *  Tant qu'une valeur n'est pas renseignée, le site l'affiche telle quelle
 *  (surlignée en vert clair dans les zones principales) et ne crée
 *  aucun lien cassé (téléphone, e-mail, itinéraire, réservation).
 * ============================================================================
 */

export const TODO = "[À RENSEIGNER]";

export type OpeningDay = {
  /** Libellé affiché */
  day: string;
  /** Jour au format Schema.org (ne pas traduire) */
  schemaDay: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  /**
   * Plages horaires au format "08:00-12:00".
   * [] = fermé. [TODO] = non renseigné.
   */
  slots: string[];
};

export const SITE = {
  /** Texte affiché à la place du logo (header et footer) */
  LOGO_TEXT: "Leopold PIRARD",
  /** Nom du cabinet, ex. "Cabinet de kinésithérapie Dupont" */
  CABINET_NAME: TODO,
  /** Prénom et nom du kinésithérapeute */
  PRACTITIONER_NAME: "Leopold PIRARD",
  /** Profession affichée sous le nom */
  PRACTITIONER_TITLE: "Masseur-kinésithérapeute",

  /** Adresse — numéro et rue */
  ADDRESS: "11 avenue Jules Ferry",
  /** Complément éventuel (bâtiment, étage…). Laisser "" si inutile. */
  ADDRESS_COMPLEMENT: "",
  POSTAL_CODE: "66380",
  CITY: "Pia",

  /** Téléphone au format affiché, ex. "04 68 00 00 00" */
  PHONE: "04 68 63 40 20",
  /** E-mail affiché sur le site. Laisser "" s'il n'y en a pas : il est alors masqué partout. */
  EMAIL: "",


  /**
   * Horaires d'ouverture INITIAUX. Au premier démarrage, ils sont copiés dans la
   * base de données ; ensuite, modifiez-les depuis l'espace admin (/admin/horaires).
   */
  OPENING_HOURS: [
    { day: "Lundi", schemaDay: "Monday", slots: [] },
    { day: "Mardi", schemaDay: "Tuesday", slots: ["08:30-19:30"] },
    { day: "Mercredi", schemaDay: "Wednesday", slots: ["08:30-19:30"] },
    { day: "Jeudi", schemaDay: "Thursday", slots: ["08:30-19:30"] },
    { day: "Vendredi", schemaDay: "Friday", slots: ["08:30-19:30"] },
    { day: "Samedi", schemaDay: "Saturday", slots: [] },
    { day: "Dimanche", schemaDay: "Sunday", slots: [] },
  ] as OpeningDay[],

  /**
   * Lien Google Maps du cabinet (fiche ou itinéraire).
   * Si non renseigné, un lien d'itinéraire est construit à partir de l'adresse.
   */
  GOOGLE_MAPS_URL: TODO,
  /** Coordonnées GPS pour la carte (ex. 42.6986, 2.8956). null = pas de carte. */
  LATITUDE: 42.743417 as number | null,
  LONGITUDE: 2.91743 as number | null,

  /** Réseaux sociaux — laisser "" pour masquer */
  INSTAGRAM_URL: "",
  FACEBOOK_URL: "",

  /** Accès au cabinet (affiché sur /cabinet et /contact) */
  ACCESS: {
    accessibility: "Accès facilité pour les personnes en situation de handicap.",
    parking: "Parking devant le cabinet.",
    transport: "Bus 503, ou lignes 5 et 15 du réseau Sankéo.",
  },

  /** Adresse publique du site (définie dans .env via NEXT_PUBLIC_SITE_URL) */
  SITE_URL: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  /**
   * Autoriser les moteurs de recherche à indexer le site.
   * Laisser à false tant que les informations ne sont pas complètes,
   * puis passer à true au moment de la mise en ligne définitive.
   */
  INDEXING_ENABLED: false,
};

/* ------------------------------------------------------------------------- */
/*  Utilitaires — ne pas modifier                                             */
/* ------------------------------------------------------------------------- */

/** true si la valeur est réellement renseignée */
export function isSet(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "" && !value.includes(TODO);
}

/** Adresse complète sur une ligne (ou TODO si incomplète) */
export function fullAddress(): string {
  if (!isAddressSet()) return TODO;
  const parts = [SITE.ADDRESS, SITE.ADDRESS_COMPLEMENT, `${SITE.POSTAL_CODE} ${SITE.CITY}`];
  return parts.filter((p) => p.trim() !== "").join(", ");
}

export function isAddressSet(): boolean {
  return isSet(SITE.ADDRESS) && isSet(SITE.POSTAL_CODE) && isSet(SITE.CITY);
}

/** Lien "tel:" international à partir d'un numéro français */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.startsWith("0")) return `tel:+33${digits.slice(1)}`;
  return `tel:${digits}`;
}

/** Lien d'itinéraire, ou null si l'adresse n'est pas renseignée */
export function directionsUrl(): string | null {
  if (isSet(SITE.GOOGLE_MAPS_URL)) return SITE.GOOGLE_MAPS_URL;
  if (!isAddressSet()) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress())}`;
}

export const hasPhone = () => isSet(SITE.PHONE);
export const hasEmail = () => isSet(SITE.EMAIL);
