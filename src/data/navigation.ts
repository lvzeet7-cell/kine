export type NavItem = { label: string; href: string; /** false = lien affiché seulement dans le pied de page */ inHeader?: boolean };

export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Le cabinet", href: "/cabinet" },
  { label: "Le kinésithérapeute", href: "/kinesitherapeute" },
  { label: "Soins conventionnés", href: "/soins" },
  { label: "Soins non conventionnés", href: "/soins-non-conventionnes" },
  { label: "Mon bilan prévention", href: "/mon-bilan-prevention" },
  { label: "Déroulement", href: "/deroulement" },
  { label: "Téléconsultation", href: "/teleconsultation", inHeader: false },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

/** Liens du header (ordinateur et menu mobile) */
export const headerNav = mainNav.filter((i) => i.inHeader !== false);

export const legalNav: NavItem[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Cookies", href: "/cookies" },
];
