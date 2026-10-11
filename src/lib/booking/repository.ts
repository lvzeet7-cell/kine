import type {
  AdminNotification,
  Appointment,
  AppointmentFilter,
  AvailabilityRule,
  Closure,
  NotificationType,
  Teleconsultation,
  Unavailability,
} from "./types";

export type NewAppointment = Omit<Appointment, "createdAt" | "updatedAt" | "cancelledAt" | "reminderSentAt">;

export type AppointmentPatch = Partial<
  Pick<
    Appointment,
    | "serviceId"
    | "serviceName"
    | "duration"
    | "startAt"
    | "endAt"
    | "firstName"
    | "lastName"
    | "phone"
    | "email"
    | "message"
    | "status"
    | "reminderSentAt"
    | "cancelledAt"
  >
>;

export type WriteResult = { ok: true; appointment: Appointment } | { ok: false; reason: "conflict" | "not_found" };

/**
 * Accès aux données. Deux implémentations :
 * - SqliteRepository (production, fichier SQLite)
 * - MemoryRepository (tests et aperçu)
 *
 * `insertIfFree` et `updateIfFree` sont ATOMIQUES : la vérification du créneau
 * et l'écriture se font dans une même transaction verrouillée.
 */
export interface BookingRepository {
  listAppointments(filter?: AppointmentFilter): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | null>;
  getAppointmentByTokenHash(hash: string): Promise<Appointment | null>;
  /** Rendez-vous actifs (PENDING/CONFIRMED) qui chevauchent [from, to) */
  listBusy(from: string, to: string): Promise<Pick<Appointment, "id" | "startAt" | "endAt">[]>;
  insertIfFree(appt: NewAppointment): Promise<WriteResult>;
  /** Met à jour ; si `checkConflict`, refuse si le nouvel horaire chevauche un autre rendez-vous actif */
  updateIfFree(id: string, patch: AppointmentPatch, checkConflict: boolean): Promise<WriteResult>;
  deleteAppointment(id: string): Promise<boolean>;
  /** Remplace l'empreinte du jeton de gestion (nouveau lien envoyé au patient) */
  setManagementTokenHash(id: string, hash: string): Promise<void>;
  /** Supprime les rendez-vous terminés avant `before` ; renvoie le nombre supprimé */
  purgeBefore(before: string): Promise<number>;

  listAvailability(): Promise<AvailabilityRule[]>;
  replaceAvailability(rules: Omit<AvailabilityRule, "id">[]): Promise<AvailabilityRule[]>;

  listClosures(): Promise<Closure[]>;
  addClosure(c: Omit<Closure, "id" | "createdAt">): Promise<Closure>;
  deleteClosure(id: string): Promise<boolean>;

  listUnavailabilities(from?: string, to?: string): Promise<Unavailability[]>;
  addUnavailability(u: Omit<Unavailability, "id" | "createdAt">): Promise<Unavailability>;
  deleteUnavailability(id: string): Promise<boolean>;

  /* Téléconsultations */
  getTeleconsultation(appointmentId: string): Promise<Teleconsultation | null>;
  listTeleconsultations(appointmentIds: string[]): Promise<Teleconsultation[]>;
  /** Crée ou remplace la fiche de téléconsultation d'un rendez-vous */
  saveTeleconsultation(t: Teleconsultation): Promise<void>;

  /* Réglages (clé → valeur JSON) */
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  /* Limitation des tentatives (stockée en base : partagée entre toutes les instances du serveur) */
  /** Enregistre un passage dans `bucket` et renvoie le nombre de passages depuis `since` (ms), celui-ci compris */
  recordHit(bucket: string, now: number, since: number): Promise<number>;
  /** Supprime les passages antérieurs à `before` (ms) */
  purgeHits(before: number): Promise<number>;

  addNotification(type: NotificationType, appointmentId: string | null, message: string): Promise<void>;
  listNotifications(limit?: number): Promise<AdminNotification[]>;
  markNotificationsRead(ids?: string[]): Promise<void>;
}
