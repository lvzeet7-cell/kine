/**
 * ============================================================================
 *  CONFIGURATION DE LA PRISE DE RENDEZ-VOUS
 * ============================================================================
 *  Modifiez ici les types de rendez-vous et les règles de réservation.
 *
 *  - Les horaires d'ouverture sont ceux de src/data/site.ts (valeurs initiales),
 *    puis modifiables depuis l'espace admin (/admin/horaires).
 *  - Les congés et indisponibilités se gèrent depuis l'espace admin.
 * ============================================================================
 */

export type BookingService = {
  /** Identifiant utilisé dans les liens : /rendez-vous?service=bilan */
  id: string;
  name: string;
  description?: string;
  /** Durée en minutes */
  duration: number;
  enabled: boolean;
  /** "video" = téléconsultation (durée et activation réglées depuis l'espace admin) */
  mode?: "cabinet" | "video";
  /** Tarif affiché (renseigné à l'exécution pour la téléconsultation) */
  price?: string | null;
};

export const bookingConfig = {
  /** Fuseau horaire du cabinet (ne pas modifier sauf déménagement…) */
  timezone: "Europe/Paris",

  /** Délai minimum entre la réservation et le rendez-vous (minutes) */
  minimumNoticeMinutes: 120,

  /** Réservation possible jusqu'à N jours à l'avance */
  maximumAdvanceDays: 60,

  /** En deçà de ce délai, le patient ne peut plus annuler/modifier en ligne (heures) */
  cancellationDeadlineHours: 48,

  /** Règle du cabinet affichée aux patients (FAQ, page de rendez-vous, e-mail de confirmation) */
  cancellationPolicy: "Au bout de 3 annulations, la prise en charge ne pourra plus être assurée.",

  /**
   * Pas entre deux créneaux proposés (minutes).
   * null = pas égal à la durée du rendez-vous (14:00, 14:45, 15:30 pour 45 min).
   */
  slotIntervalMinutes: null as number | null,

  /** true : réservation en ligne confirmée immédiatement. false : statut « en attente ». */
  autoConfirm: true,

  /**
   * ⚠️ À VALIDER PAR LE KINÉSITHÉRAPEUTE : noms, descriptions et durées.
   * Ce sont des exemples de départ. Passez `enabled: false` pour masquer un type.
   */
  services: [
    {
      id: "premiere-consultation",
      name: "Première consultation",
      description: "Premier rendez-vous au cabinet : échange et bilan.",
      duration: 30,
      enabled: true,
    },
    {
      id: "seance",
      name: "Séance de kinésithérapie",
      description: "Séance dans le cadre d'une prise en charge en cours.",
      duration: 30,
      enabled: true,
    },
    {
      id: "suivi",
      name: "Suivi",
      description: "Point d'étape sur votre évolution.",
      duration: 30,
      enabled: true,
    },
    {
      id: "bilan",
      name: "Bilan",
      description: "Évaluation de vos besoins.",
      duration: 30,
      enabled: true,
    },
    {
      id: "bilan-prevention",
      name: "Mon bilan prévention",
      description: "Bilan pris en charge à 100 % pour les 18-25, 45-50, 60-65 et 70-75 ans.",
      // Durée officielle : 30 à 45 minutes
      duration: 45,
      enabled: true,
    },
    {
      id: "teleconsultation",
      name: "Téléconsultation",
      description: "Consultation vidéo avec Leopold PIRARD, depuis chez vous.",
      // Durée par défaut : modifiable depuis l'espace admin (Téléconsultations > Réglages)
      duration: 30,
      enabled: true,
      mode: "video",
    },
    {
      id: "autre",
      name: "Autre",
      description: "Pour toute autre demande de rendez-vous.",
      duration: 30,
      enabled: true,
    },
  ] as BookingService[],

  reminders: {
    /** Active l'envoi des rappels par e-mail (nécessite la tâche planifiée, voir README) */
    enabled: true,
    /** Rappel envoyé N heures avant le rendez-vous */
    hoursBefore: 24,
  },

  /**
   * RGPD : les rendez-vous passés sont supprimés automatiquement
   * après ce nombre de jours (lors de la tâche planifiée quotidienne).
   */
  dataRetentionDays: 365,
};

export function getService(id: string | null | undefined): BookingService | undefined {
  if (!id) return undefined;
  return bookingConfig.services.find((s) => s.id === id && s.enabled);
}

export const enabledServices = () => bookingConfig.services.filter((s) => s.enabled);

/**
 * Délai du rappel, en heures (serveur uniquement).
 * La variable d'environnement REMINDER_HOURS_BEFORE remplace la valeur ci-dessus si elle est définie.
 */
export function reminderHoursBefore(): number {
  const fromEnv = Number(typeof process !== "undefined" ? process.env?.REMINDER_HOURS_BEFORE : undefined);
  return fromEnv > 0 ? fromEnv : bookingConfig.reminders.hoursBefore;
}
