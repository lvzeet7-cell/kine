/**
 * ============================================================================
 *  LE KINÉSITHÉRAPEUTE
 * ============================================================================
 *  Remplacez chaque TODO. N'indiquez que des diplômes et formations réels,
 *  et vérifiez leur affichage autorisé auprès de l'Ordre si besoin.
 *  Une liste vide [] masque la rubrique correspondante.
 * ============================================================================
 */

import { SITE, TODO } from "./site";

export const practitioner = {
  name: SITE.PRACTITIONER_NAME,
  title: SITE.PRACTITIONER_TITLE,

  /** Présentation (un paragraphe par élément) */
  intro: [
    "Fort de 33 années d'expérience en kinésithérapie, je vous accompagne dans votre parcours de soins avec une approche fondée sur l'écoute, l'expertise et l'individualisation de la prise en charge.",
    "Spécialisé dans la kinésithérapie du sport, je prends en charge les douleurs et troubles musculosquelettiques, qu'ils soient liés à la pratique sportive, à une blessure ou aux contraintes du quotidien.",
    "Ma pratique associe notamment la méthode McKenzie – MDT, la thérapie manuelle et la rééducation active afin de vous aider à retrouver mobilité, force et autonomie.",
    "Chaque prise en charge est adaptée à votre situation, à vos objectifs et à votre rythme, avec une volonté : vous permettre de retrouver durablement vos capacités et de reprendre vos activités en toute confiance.",
  ],

  /** Parcours professionnel — ex. { period: "Depuis 2005", text: "Installation au cabinet" } */
  career: [{ period: TODO, text: TODO }],

  /** Diplômes — ex. "Diplôme d'État de masseur-kinésithérapeute (année)" */
  diplomas: [TODO],

  /** Formations complémentaires suivies */
  trainings: [TODO],

  /** Domaines de prise en charge privilégiés (repris de la présentation) */
  specialties: [
    "Kinésithérapie du sport",
    "Douleurs et troubles musculosquelettiques",
    "Méthode McKenzie – MDT",
    "Thérapie manuelle",
    "Rééducation active",
  ],

  /** Approche des soins, en quelques phrases — [] = rubrique masquée (déjà décrite dans la présentation) */
  approach: [] as string[],

  /** Numéro RPPS (identifiant professionnel), affiché dans le pied de page et les mentions légales */
  rpps: "10005393920",
};
