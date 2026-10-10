/**
 * ============================================================================
 *  SOINS NON CONVENTIONNÉS
 * ============================================================================
 *  Soins hors nomenclature de l'Assurance Maladie (non remboursés).
 *  ⚠️ À VALIDER par le kinésithérapeute : textes, durée et tarif.
 *  L'affichage des tarifs est obligatoire.
 *
 *  Chaque objet crée automatiquement une page /soins-non-conventionnes/[slug].
 * ============================================================================
 */

import type { IconName } from "@/components/ui/Icon";
import { TODO } from "./site";

/** Bannière illustrée en haut de la fiche (facultatif) */
export type CareHero = {
  image: { src: string; alt: string; position?: string };
  /** Première partie du titre, en capitales fines (ex. « Massage suédois / ») */
  titleTop: string;
  /** Seconde partie du titre, en capitales grasses */
  titleBottom: string;
  intro: string;
  tags: { icon: IconName; label: string }[];
  benefits: { icon: IconName; title: string; text: string }[];
  /** Petite ligne décorative en bas du bandeau des bénéfices */
  signature?: string[];
};

export type NonConventionedCare = {
  slug: string;
  title: string;
  /** Une à deux phrases, affichées sur la carte */
  description: string;
  /** Meta description (≈ 150 caractères) */
  metaDescription: string;
  /** Introduction en haut de la fiche */
  intro: string;
  /** Paragraphes « En quoi cela consiste » */
  details: string[];
  /** « Pour qui ? » */
  audience: string[];
  steps: { title: string; text: string }[];
  practical: string[];
  duration?: string;
  price: string;
  hero?: CareHero;
};

export const nonConventionnes: NonConventionedCare[] = [
  {
    slug: "bilan-force-dynamometre",
    title: "Bilan de force au dynamomètre",
    description:
      "Mesure de la force de vos muscles à l'aide d'un dynamomètre. Les valeurs chiffrées obtenues servent de repère et permettent de suivre votre évolution dans le temps.",
    metaDescription:
      "Bilan de force au dynamomètre : mesure chiffrée de la force musculaire, comparaison droite/gauche et suivi de votre évolution.",
    intro:
      "Un bilan qui mesure objectivement la force de vos muscles grâce à un dynamomètre, pour obtenir des valeurs chiffrées plutôt qu'une simple appréciation.",
    details: [
      "Le dynamomètre est un appareil qui mesure la force produite par un muscle ou un groupe musculaire. Vous poussez ou tirez contre l'appareil, dans une position précise, et la force développée est enregistrée.",
      "Les mesures permettent de comparer le côté droit et le côté gauche, de repérer un éventuel déséquilibre entre deux groupes musculaires, et de disposer d'un point de départ chiffré.",
      "En répétant le bilan quelques semaines plus tard, dans les mêmes conditions, vous pouvez suivre votre évolution de façon concrète. Ces repères peuvent aussi aider à préparer une reprise sportive.",
    ],
    audience: [
      "Les sportifs qui veulent connaître leur niveau de force ou suivre leur progression",
      "Les personnes qui préparent une reprise du sport après une blessure",
      "Toute personne qui souhaite un état des lieux chiffré de sa force musculaire",
    ],
    steps: [
      { title: "Échange", text: "Point sur votre pratique, vos objectifs et les zones à évaluer." },
      { title: "Échauffement", text: "Quelques mouvements simples pour préparer les muscles testés." },
      { title: "Mesures", text: "Tests au dynamomètre, répétés pour fiabiliser les valeurs, côté droit et côté gauche." },
      { title: "Restitution", text: "Explication des résultats et repères pour la suite." },
    ],
    practical: [
      "Soin non remboursé par l'Assurance Maladie. Certaines complémentaires santé peuvent en prendre une partie en charge.",
      "Prévoyez une tenue de sport.",
      `Groupes musculaires évalués : ${TODO}`,
    ],
    duration: "20 à 30 min",
    price: TODO,
  },
  {
    slug: "analyse-course-a-pied",
    title: "Analyse de la course à pied",
    description:
      "Observation de votre foulée et de votre façon de courir, pour vous donner des repères et des conseils adaptés à votre pratique.",
    metaDescription:
      "Analyse de la course à pied : observation de votre foulée, de votre entraînement et de vos chaussures, avec des conseils adaptés à votre pratique.",
    intro:
      "Une séance consacrée à votre façon de courir : votre foulée, votre entraînement et votre matériel, pour repartir avec des repères concrets.",
    details: [
      "Chaque coureur a sa propre façon de courir. L'analyse commence par un échange sur votre pratique : fréquence et volume d'entraînement, objectifs, blessures passées éventuelles, chaussures utilisées.",
      "Votre course est ensuite observée : posture, pose du pied, cadence, mouvements des bras et du bassin. L'objectif n'est pas de chercher une foulée « parfaite », mais de repérer ce qui peut être ajusté dans votre situation.",
      "Vous repartez avec des conseils adaptés : progression de l'entraînement, éventuels exercices, et repères sur le choix de vos chaussures.",
    ],
    audience: [
      "Les coureurs débutants qui veulent démarrer sur de bonnes bases",
      "Les coureurs réguliers ou compétiteurs qui veulent faire le point sur leur pratique",
      "Les coureurs qui reprennent après une pause ou une blessure",
    ],
    steps: [
      { title: "Échange", text: "Votre pratique, votre entraînement, vos objectifs et vos chaussures." },
      { title: "Observation", text: "Analyse de votre façon de courir." },
      { title: "Explications", text: "Ce qui a été observé, expliqué simplement." },
      { title: "Conseils", text: "Repères pour l'entraînement, exercices éventuels et conseils sur le matériel." },
    ],
    practical: [
      "Soin non remboursé par l'Assurance Maladie. Certaines complémentaires santé peuvent en prendre une partie en charge.",
      "Venez en tenue de course, avec vos chaussures habituelles.",
      "Si vous en avez, apportez vos données d'entraînement (montre, application).",
      `Matériel utilisé pour l'analyse (vidéo, tapis de course…) : ${TODO}`,
    ],
    duration: "20 à 30 min",
    price: TODO,
  },
  {
    slug: "massage-suedois-recuperation-sportive",
    title: "Massage suédois / Récupération sportive",
    description:
      "Massage manuel des muscles, pour la détente et la récupération après l'effort, que vous pratiquiez le sport en loisir ou en compétition.",
    metaDescription:
      "Massage suédois et récupération sportive : un massage manuel des muscles pour la détente et la récupération après l'effort.",
    intro:
      "Un massage manuel des muscles, pour la détente et la récupération, après un effort sportif ou simplement pour relâcher les tensions.",
    details: [
      "Le massage suédois est une forme classique de massage. Il associe plusieurs gestes : effleurages (glissés doux), pétrissages des muscles, frictions et percussions légères.",
      "En récupération sportive, le massage est adapté à votre activité et aux muscles les plus sollicités : jambes après une course, épaules et dos après un sport de raquette ou de natation, par exemple.",
      "La pression et le rythme sont ajustés à votre ressenti tout au long de la séance. Ce massage est un soin de bien-être et de récupération ; il ne remplace pas une rééducation.",
    ],
    audience: [
      "Les sportifs, en loisir ou en compétition, après un entraînement ou une compétition",
      "Toute personne qui souhaite un moment de détente musculaire",
    ],
    steps: [
      { title: "Échange", text: "Votre activité, les zones à privilégier et d'éventuelles contre-indications." },
      { title: "Installation", text: "Installation confortable sur la table de massage." },
      { title: "Massage", text: "Massage manuel, avec une pression adaptée à votre ressenti." },
      { title: "Conseils", text: "Quelques repères pour prolonger la récupération." },
    ],
    practical: [
      "Soin non remboursé par l'Assurance Maladie. Certaines complémentaires santé peuvent en prendre une partie en charge.",
      "Signalez toute blessure récente, douleur inhabituelle ou problème de santé avant la séance.",
      `Produit utilisé (huile, crème…) : ${TODO}`,
    ],
    duration: "20 à 30 min",
    price: TODO,
    hero: {
      image: {
        src: "/images/massage-recuperation.jpg",
        alt: "Kinésithérapeute massant le haut du dos d'un sportif allongé sur la table",
        position: "70% 40%",
      },
      titleTop: "Massage suédois /",
      titleBottom: "Récupération sportive",
      intro:
        "Un soin sur mesure pour détendre vos muscles et accompagner votre récupération après l'effort, que vous soyez sportif amateur ou confirmé.",
      tags: [
        { icon: "stride", label: "Running" },
        { icon: "dumbbell", label: "Musculation" },
        { icon: "bike", label: "Cyclisme" },
        { icon: "mountain", label: "Sports outdoor" },
      ],
      benefits: [
        { icon: "flex", title: "Détend les muscles", text: "Relâche les tensions et la sensation de raideur musculaire." },
        { icon: "refresh", title: "Accompagne la récupération", text: "Un temps de récupération après l'entraînement ou la compétition." },
        { icon: "shield", title: "Vous prépare", text: "Un moment pour relâcher le corps entre deux séances d'effort." },
        { icon: "stride", title: "Adapté à votre sport", text: "Le massage cible les muscles les plus sollicités par votre pratique." },
      ],
      signature: ["Soins", "Récupération", "Performance"],
    },
  },
  {
    slug: "therapie-manuelle-orthopedique",
    title: "Thérapie manuelle orthopédique",
    description:
      "Évaluation approfondie et traitement manuel des douleurs articulaires et vertébrales, associés à des exercices adaptés.",
    metaDescription:
      "Thérapie manuelle orthopédique : examen clinique approfondi, techniques manuelles et exercices pour les douleurs du dos, du cou et des articulations.",
    intro:
      "Une approche spécialisée de la kinésithérapie, qui associe un examen clinique approfondi, des techniques manuelles précises et des exercices adaptés.",
    details: [
      "La thérapie manuelle orthopédique s'intéresse aux douleurs et aux limitations de mouvement des articulations, de la colonne vertébrale (cou, dos, bas du dos), des muscles et des nerfs.",
      "Tout commence par un examen détaillé : questions sur vos symptômes, tests de mouvement, palpation. Ce raisonnement clinique permet de choisir les techniques les plus adaptées, ou de vous orienter vers un autre professionnel si nécessaire.",
      "Le traitement associe des techniques manuelles (mobilisations articulaires, techniques sur les tissus mous et les nerfs) et des exercices à poursuivre chez vous, pour que vous restiez acteur de votre récupération.",
    ],
    audience: [
      "Les personnes souffrant de douleurs au cou, au dos ou au bas du dos",
      "Les douleurs et raideurs articulaires (épaule, hanche, genou, cheville…)",
      "Celles et ceux qui souhaitent un bilan manuel approfondi de leur problème",
    ],
    steps: [
      { title: "Échange", text: "Vos symptômes, leur évolution, vos activités et vos attentes." },
      { title: "Examen clinique", text: "Tests de mouvement, palpation et tests spécifiques pour comprendre l'origine du problème." },
      { title: "Traitement manuel", text: "Techniques manuelles adaptées, avec une intensité ajustée à votre ressenti." },
      { title: "Exercices et conseils", text: "Exercices simples à poursuivre chez vous et repères pour la suite." },
    ],
    practical: [
      "Soin non remboursé par l'Assurance Maladie. Certaines complémentaires santé peuvent en prendre une partie en charge.",
      "Prévoyez une tenue souple permettant de bouger facilement.",
      "Apportez vos examens récents (radiographies, IRM, comptes rendus) si vous en avez.",
    ],
    duration: "20 à 30 min",
    price: TODO,
  },
];

export function getNonConventionedCare(slug: string): NonConventionedCare | undefined {
  return nonConventionnes.find((c) => c.slug === slug);
}
