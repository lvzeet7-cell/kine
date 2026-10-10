import type { IconName } from "@/components/ui/Icon";

/**
 * ============================================================================
 *  SOINS CONVENTIONNÉS
 * ============================================================================
 *  ⚠️ À VALIDER PAR LE KINÉSITHÉRAPEUTE.
 *  Textes rédigés à partir de sources publiques (consultées le 2 octobre 2026) :
 *   - Institut McKenzie France : https://institut.mckenzie.fr/patients/quest-ce-que-le-mdt/
 *   - Wikipédia, « Méthode McKenzie »
 *   - La Clinique du Coureur : https://lacliniqueducoureur.com
 *  Aucune promesse de résultat. Les informations propres au cabinet sont marquées TODO.
 *
 *  Chaque objet crée automatiquement une page /soins/[slug].
 * ============================================================================
 */

import { TODO } from "./site";

export type Service = {
  slug: string;
  title: string;
  icon: IconName;
  /** Logo de l'organisme ou de la méthode (fichier dans /public/images) */
  logo?: { src: string; alt: string; width: number; height: number };
  /** Une phrase, affichée sur les cartes */
  summary: string;
  /** Meta description (≈ 150 caractères) */
  metaDescription: string;
  intro: string;
  description: string[];
  objectives: string[];
  steps: { title: string; text: string }[];
  practical: string[];
};

export const services: Service[] = [
  {
    slug: "clinique-du-coureur",
    title: "La Clinique du Coureur",
    icon: "stride",
    logo: { src: "/images/logo-clinique-du-coureur.png", alt: "La Clinique du Coureur", width: 720, height: 299 },
    summary: "Prise en charge des blessures liées à la course à pied, selon l'approche de La Clinique du Coureur.",
    metaDescription:
      "Blessures du coureur : une prise en charge selon l'approche de La Clinique du Coureur, centrée sur la gestion de l'entraînement et le retour progressif à la course.",
    intro:
      "Une prise en charge des blessures liées à la course à pied, fondée sur l'approche de La Clinique du Coureur, organisme de formation créé au Québec par le physiothérapeute Blaise Dubois.",
    description: [
      "Depuis 2008, La Clinique du Coureur forme les professionnels de santé à la prévention et au traitement des blessures liées à la course à pied. Son approche s'appuie sur les données de la recherche scientifique et privilégie les solutions simples.",
      "Un principe central : beaucoup de blessures du coureur viennent d'une charge d'entraînement mal adaptée, le fameux « trop, trop vite ». La prise en charge cherche donc d'abord à comprendre votre entraînement et à l'ajuster, et, lorsque c'est possible, à adapter votre pratique plutôt qu'à l'arrêter complètement.",
      "Les séances associent traitement, exercices et conseils : progression de l'entraînement, choix de chaussures simples et confortables, et plan de retour progressif à la course. Que vous couriez pour le plaisir ou en compétition, l'objectif est que vous repartiez avec des repères clairs pour la suite.",
    ],
    objectives: [
      "Comprendre l'origine de votre blessure",
      "Adapter votre charge d'entraînement",
      "Reprendre la course de façon progressive",
      "Limiter le risque de récidive",
    ],
    steps: [
      { title: "Bilan", text: "Échange sur votre blessure, votre historique d'entraînement et vos chaussures, puis examen clinique." },
      { title: "Plan de prise en charge", text: "Ajustement de votre entraînement et choix des exercices adaptés à votre situation." },
      { title: "Séances", text: "Traitement et exercices progressifs, réévalués au fil de votre évolution." },
      { title: "Retour à la course", text: "Plan de reprise progressif et conseils pour continuer à courir en limitant les risques." },
    ],
    practical: [
      "Une prescription médicale est en principe nécessaire pour la prise en charge par l'Assurance Maladie.",
      "Apportez vos chaussures de course habituelles et, si vous en avez, vos données d'entraînement (montre, application).",
      `Formation du kinésithérapeute à cette approche : ${TODO}`,
      "Durée d'une séance : entre 20 et 30 minutes.",
    ],
  },
  {
    slug: "methode-mckenzie",
    title: "La méthode McKenzie",
    icon: "motion",
    logo: { src: "/images/logo-mckenzie.png", alt: "Institut McKenzie France", width: 303, height: 160 },
    summary: "Évaluation et traitement des douleurs du dos, du cou et des membres, avec des exercices que vous apprenez à faire seul.",
    metaDescription:
      "Méthode McKenzie (MDT) : évaluation et traitement des douleurs de la colonne vertébrale et des membres, fondés sur les mouvements et l'autonomie du patient.",
    intro:
      "La méthode McKenzie, aussi appelée MDT (Diagnostic et Thérapie Mécanique), est une méthode d'évaluation et de traitement des douleurs de la colonne vertébrale (dos, cou) et des membres.",
    description: [
      "Elle a été développée à partir de la fin des années 1950 par Robin McKenzie, kinésithérapeute néo-zélandais. Elle est aujourd'hui enseignée dans de nombreux pays et a fait l'objet de nombreuses études scientifiques.",
      "Le bilan en est l'étape clé. Le kinésithérapeute observe comment vos symptômes réagissent à des mouvements répétés et à certaines positions. Cela permet de repérer, lorsqu'elle existe, une « préférence directionnelle » : un mouvement ou une position qui soulage vos symptômes.",
      "Le traitement repose ensuite sur l'auto-traitement : vous apprenez des exercices simples à réaliser chez vous, pour agir vous-même sur vos symptômes et gagner en autonomie. Si la méthode n'est pas adaptée à votre situation, vous êtes orienté vers le professionnel approprié.",
    ],
    objectives: [
      "Identifier les mouvements et positions qui vous soulagent",
      "Retrouver de la mobilité au quotidien",
      "Devenir autonome grâce à vos exercices",
      "Savoir réagir si la douleur réapparaît",
    ],
    steps: [
      { title: "Bilan mécanique", text: "Questions sur vos douleurs, puis tests de mouvements répétés et de positions." },
      { title: "Classification", text: "Le kinésithérapeute détermine si votre situation relève de la méthode et comment l'aborder." },
      { title: "Auto-traitement", text: "Apprentissage d'exercices simples et de conseils de posture à appliquer chez vous." },
      { title: "Suivi et prévention", text: "Ajustement des exercices au fil des séances, et repères pour prévenir les récidives." },
    ],
    practical: [
      "Une prescription médicale est en principe nécessaire pour la prise en charge par l'Assurance Maladie.",
      "Prévoyez une tenue souple permettant de bouger facilement.",
      `Formation McKenzie du kinésithérapeute : ${TODO}`,
      "Durée d'une séance : entre 20 et 30 minutes.",
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
