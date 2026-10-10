/**
 * ============================================================================
 *  IMAGES DU SITE
 * ============================================================================
 *  1. Déposez vos photos dans /public/images/ (JPG ou PNG, 2000 px de large
 *     maximum suffit — Next.js les convertit automatiquement en AVIF/WebP).
 *  2. Renseignez `src` (ex. "/images/cabinet-accueil.jpg") et les dimensions
 *     réelles de la photo (width / height en pixels).
 *  3. Écrivez un texte alternatif `alt` qui décrit la photo.
 *  Tant que `src` vaut null, un emplacement neutre est affiché.
 * ============================================================================
 */

export type SiteImage = {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  /** Nom de l'emplacement, affiché tant que la photo manque */
  slot: string;
  /** Cadrage de la photo dans son cadre (CSS object-position), ex. "20% 50%" */
  position?: string;
};

const placeholder = (slot: string, width = 1600, height = 2000): SiteImage => ({
  src: null,
  alt: "",
  width,
  height,
  slot,
});

export const images = {
  /** Bannière de la page d'accueil (photo pleine largeur, texte posé à gauche) */
  hero: {
    src: "/images/hero-seance.jpg",
    alt: "Kinésithérapeute mobilisant le genou d'un patient allongé lors d'une séance",
    width: 1270,
    height: 546,
    slot: "Photo de la bannière d'accueil",
    position: "62% 35%",
  } as SiteImage,
  intro: {
    src: "/images/espace-reeducation.jpg",
    alt: "Espace de rééducation du cabinet avec ballons, tapis, petit matériel et vélo d'appartement",
    width: 677,
    height: 509,
    slot: "Photo d'une séance ou de la salle de soins",
  } as SiteImage,
  practitioner: {
    src: "/images/portrait-leopold-pirard.jpg",
    alt: "Portrait de Leopold PIRARD, masseur-kinésithérapeute, dans l'espace de rééducation du cabinet",
    width: 176,
    height: 176,
    slot: "Portrait du kinésithérapeute",
  } as SiteImage,
  og: null as string | null,
};

/**
 * Galerie de la page « Le cabinet ».
 * La première photo est mise en avant. Ajoutez simplement de nouvelles entrées
 * à la liste (salle d'attente, portrait en séance…) : la grille s'adapte.
 */
export const gallery: SiteImage[] = [
  {
    src: "/images/espace-reeducation.jpg",
    alt: "Espace de rééducation avec ballons, tapis, petit matériel, vélo d'appartement et sol souple",
    width: 677,
    height: 509,
    slot: "Espace de rééducation",
  },
  {
    src: "/images/salle-de-soins.jpg",
    alt: "Salle de soins avec table de kinésithérapie et tabouret, mur vert et fenêtre",
    width: 381,
    height: 513,
    slot: "Salle de soins",
  },
  {
    src: "/images/espalier.jpg",
    alt: "Espalier, sangles de suspension et miroir dans l'espace de rééducation",
    width: 382,
    height: 510,
    slot: "Espace de rééducation",
  },
  {
    src: "/images/facade-cabinet.jpg",
    alt: "Entrée du centre paramédical, 11 avenue Jules Ferry à Pia",
    width: 677,
    height: 302,
    slot: "Entrée du cabinet",
    position: "62% 50%",
  },
];
