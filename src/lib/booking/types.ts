export const APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuts qui occupent un créneau */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  NO_SHOW: "Absent",
};

export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  /** Instants ISO 8601 en UTC */
  startAt: string;
  endAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  status: AppointmentStatus;
  source: "online" | "admin";
  /** Empreinte SHA-256 du jeton de gestion (le jeton lui-même n'est jamais stocké) */
  managementTokenHash: string;
  consentAt: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
};

/** Plage d'ouverture hebdomadaire. dayOfWeek : 0 = dimanche … 6 = samedi */
export type AvailabilityRule = {
  id: string;
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string;
  enabled: boolean;
};

/** Fermeture (congés) : jours entiers, bornes incluses, dates locales "YYYY-MM-DD" */
export type Closure = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
};

/** Indisponibilité ponctuelle, motif interne jamais montré au patient */
export type Unavailability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
};

export type NotificationType = "NEW" | "CANCELLED" | "RESCHEDULED" | "TELE_JOINED" | "TELE_ISSUE";

export type AdminNotification = {
  id: string;
  type: NotificationType;
  appointmentId: string | null;
  message: string;
  createdAt: string;
  readAt: string | null;
};

export type AppointmentFilter = {
  from?: string; // instant ISO inclus
  to?: string; // instant ISO exclu
  statuses?: AppointmentStatus[];
  serviceId?: string;
  query?: string;
  limit?: number;
  order?: "asc" | "desc";
};

/** Vue publique d'un rendez-vous (page de gestion patient) */
export type PublicAppointment = {
  serviceId: string;
  serviceName: string;
  duration: number;
  startAt: string;
  endAt: string;
  firstName: string;
  lastName: string;
  status: AppointmentStatus;
  canManage: boolean;
};

export type Slot = { startAt: string; endAt: string; time: string };

export type DayStatus = "past" | "closed" | "full" | "unavailable" | "available" | "beyond";
export type DayAvailability = { date: string; status: DayStatus; slots: number };

/**
 * Téléconsultation liée à un rendez-vous (relation 1-1 avec Appointment).
 * Aucune donnée médicale : seulement la salle vidéo et les horodatages de connexion.
 */
export type Teleconsultation = {
  appointmentId: string;
  /** Fournisseur vidéo, ex. "daily" */
  provider: string;
  /** Nom de salle aléatoire (jamais d'information patient) ; null tant que la salle n'est pas créée */
  roomName: string | null;
  roomUrl: string | null;
  /** Tarif affiché au moment de la réservation, en centimes ; null = non renseigné */
  priceCents: number | null;
  patientJoinedAt: string | null;
  practitionerJoinedAt: string | null;
  /** Dernier problème technique signalé par le patient (texte court, sans donnée médicale) */
  issueReport: string | null;
  issueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Réglages de la téléconsultation, modifiables depuis l'espace admin */
export type TeleSettings = {
  enabled: boolean;
  /** Durée en minutes */
  duration: number;
  /** Tarif en centimes ; null = non renseigné (affiché « Tarif communiqué par le cabinet ») */
  priceCents: number | null;
};
