/**
 * ============================================================================
 *  TÉMOIGNAGES
 * ============================================================================
 *  N'ajoutez que de vrais témoignages, avec l'accord écrit de la personne.
 *  Tant que cette liste est vide, la section « Ils témoignent » n'apparaît pas.
 *
 *  ⚠️ Avant d'en publier, vérifiez auprès du Conseil départemental de l'Ordre
 *  des masseurs-kinésithérapeutes ce qui est autorisé en matière de
 *  communication (code de déontologie).
 *
 *  Exemple de format :
 *  {
 *    quote: "Texte du témoignage, tel que transmis par le patient.",
 *    author: "Marie L.",
 *    context: "Rééducation après une entorse",   // optionnel
 *    date: "2026-03",                             // optionnel (AAAA-MM)
 *  },
 * ============================================================================
 */

export type Testimonial = {
  quote: string;
  author: string;
  context?: string;
  date?: string;
};

export const testimonials: Testimonial[] = [];
