/**
 * ============================================================================
 *  FAQ — questions fréquentes
 * ============================================================================
 *  Les réponses générales sont à relire ; les informations propres au cabinet
 *  sont marquées TODO. Les questions contenant encore TODO ne sont pas
 *  envoyées aux moteurs de recherche (données structurées).
 *  `home: true` affiche la question sur la page d'accueil.
 * ============================================================================
 */

import { bookingConfig } from "@/lib/booking/config";

export type FaqItem = {
  question: string;
  answer: string[];
  home?: boolean;
};

export const faq: FaqItem[] = [
  {
    question: "Comment prendre rendez-vous ?",
    answer: [
      "Vous pouvez prendre rendez-vous en ligne depuis la page « Rendez-vous » du site, ou appeler directement le cabinet.",
      "Délais : sur demande, n'hésitez pas à contacter le cabinet.",
    ],
    home: true,
  },
  {
    question: "Faut-il une ordonnance ?",
    answer: [
      "Pour que les séances soient prises en charge par l'Assurance Maladie, une prescription médicale est en principe nécessaire. Certaines situations permettent un accès direct au kinésithérapeute, dans un cadre précis.",
      "Au cabinet, il est préférable de venir avec une ordonnance.",
    ],
    home: true,
  },
  {
    question: "Comment se déroule la première séance ?",
    answer: [
      "La première séance commence par un temps d'échange : vos difficultés, vos antécédents, vos attentes. Un bilan est ensuite réalisé pour évaluer vos besoins.",
      "À partir de ce bilan, le kinésithérapeute vous explique la prise en charge proposée et répond à vos questions.",
    ],
    home: true,
  },
  {
    question: "Que faut-il apporter ?",
    answer: [
      "En règle générale : votre ordonnance, votre carte Vitale, votre attestation de complémentaire santé, ainsi que vos examens récents (radiographies, IRM, comptes rendus opératoires).",
      "Prévoyez une tenue confortable qui permet de bouger facilement.",
      "Prévoyez également une grande serviette.",
    ],
    home: true,
  },
  {
    question: "Quelle est la durée d'une séance ?",
    answer: ["Une séance dure entre 20 et 30 minutes."],
  },
  {
    question: "Où se situe le cabinet ?",
    answer: [
      "L'adresse, le plan d'accès et les informations de stationnement sont indiqués sur la page Contact.",
    ],
  },
  {
    question: "Quels moyens de paiement sont acceptés ?",
    answer: ["Le cabinet accepte les chèques, les cartes bancaires et les espèces."],
  },
  {
    question: "Comment modifier ou annuler un rendez-vous ?",
    answer: [
      "Si vous avez réservé en ligne, utilisez le lien « Gérer mon rendez-vous » de votre e-mail de confirmation (ou la rubrique « Modifier ou annuler » de la page Rendez-vous). Vous pouvez aussi appeler le cabinet.",
      `Merci de prévenir au plus tard ${bookingConfig.cancellationDeadlineHours} heures à l'avance.`,
      bookingConfig.cancellationPolicy,
    ],
  },
];
