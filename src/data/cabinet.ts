/**
 * ============================================================================
 *  LE CABINET — contenus de la page /cabinet
 * ============================================================================
 */

import { TODO } from "./site";

export const cabinet = {
  /** Présentation du cabinet (2 à 3 paragraphes courts) */
  presentation: [TODO],

  /**
   * Équipements réellement disponibles au cabinet.
   * Ex. "Table de soins électrique", "Espace de rééducation avec…"
   */
  equipment: [
    "Équipement de tecarthérapie Winback",
    "Ondes de choc",
    "Wellbox de LPG",
  ],

  /** Environnement : ambiance, lumière, calme, taille du cabinet… */
  environment: [TODO],
};

/** Étapes d'une prise en charge (page /deroulement et accueil) */
export const processSteps = [
  {
    title: "Premier échange",
    summary: "Compréhension de votre situation.",
    detail:
      "Vous expliquez ce qui vous amène : vos difficultés, depuis quand, ce qui vous gêne au quotidien. C'est aussi le moment de poser vos questions.",
  },
  {
    title: "Bilan",
    summary: "Évaluation de vos besoins.",
    detail:
      "Le kinésithérapeute évalue votre mobilité, votre force, vos douleurs et votre façon de bouger. Ce bilan sert de point de départ et de repère pour la suite.",
  },
  {
    title: "Prise en charge",
    summary: "Mise en place d'un accompagnement adapté.",
    detail:
      "Les séances sont construites à partir du bilan et de vos objectifs. Chaque étape vous est expliquée, pour que vous sachiez ce qui est fait et pourquoi.",
  },
  {
    title: "Suivi",
    summary: "Évolution et adaptation.",
    detail:
      "Votre évolution est suivie de séance en séance. Le programme est ajusté si besoin, avec des conseils pour poursuivre en autonomie.",
  },
];
