/**
 * Stockage Turso / libSQL (hébergement sans disque persistant, ex. Vercel).
 * Même schéma que SqliteRepository (SQLite).
 *
 * Anti double réservation : la vérification du chevauchement et l'écriture se font
 * dans UNE SEULE requête SQL (INSERT … SELECT … WHERE NOT EXISTS / UPDATE … WHERE NOT EXISTS).
 * SQLite exécute chaque requête d'écriture de façon atomique : deux réservations
 * simultanées ne peuvent pas passer toutes les deux. L'index unique partiel sur
 * l'heure de début reste un garde-fou supplémentaire.
 */
import { matchesFilter } from "./filter";
import type { SqlArg, SqlExecutor, SqlRow } from "./libsql";
import type { AppointmentPatch, BookingRepository, NewAppointment, WriteResult } from "./repository";
import { randomId } from "./tokens";
import type {
  AdminNotification,
  Appointment,
  AppointmentFilter,
  AppointmentStatus,
  AvailabilityRule,
  Closure,
  NotificationType,
  Teleconsultation,
  Unavailability,
} from "./types";
import { toTeleconsultation } from "./tele-row";

/** Schéma v1 — identique à SqliteRepository, avec IF NOT EXISTS (démarrages simultanés) */
const SCHEMA_V1 = [
  `CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW')),
    source TEXT NOT NULL DEFAULT 'online',
    management_token_hash TEXT NOT NULL UNIQUE,
    consent_at TEXT,
    reminder_sent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    cancelled_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS appointments_start ON appointments(start_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_start ON appointments(start_at)
    WHERE status IN ('PENDING','CONFIRMED')`,
  `CREATE TABLE IF NOT EXISTS availability (
    id TEXT PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS closures (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS unavailabilities (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS unavailabilities_date ON unavailabilities(date)`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    appointment_id TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  // v2 — téléconsultations et réglages
  `CREATE TABLE IF NOT EXISTS teleconsultations (
    appointment_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    room_name TEXT UNIQUE,
    room_url TEXT,
    price_cents INTEGER,
    patient_joined_at TEXT,
    practitioner_joined_at TEXT,
    issue_report TEXT,
    issue_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
];

const ACTIVE = `status IN ('PENDING','CONFIRMED')`;

function toAppointment(r: SqlRow): Appointment {
  return {
    id: String(r.id),
    serviceId: String(r.service_id),
    serviceName: String(r.service_name),
    duration: Number(r.duration),
    startAt: String(r.start_at),
    endAt: String(r.end_at),
    firstName: String(r.first_name),
    lastName: String(r.last_name),
    phone: String(r.phone),
    email: String(r.email),
    message: String(r.message ?? ""),
    status: String(r.status) as AppointmentStatus,
    source: r.source === "admin" ? "admin" : "online",
    managementTokenHash: String(r.management_token_hash),
    consentAt: (r.consent_at as string | null) ?? null,
    reminderSentAt: (r.reminder_sent_at as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    cancelledAt: (r.cancelled_at as string | null) ?? null,
  };
}

const COLUMN: Record<keyof AppointmentPatch, string> = {
  serviceId: "service_id",
  serviceName: "service_name",
  duration: "duration",
  startAt: "start_at",
  endAt: "end_at",
  firstName: "first_name",
  lastName: "last_name",
  phone: "phone",
  email: "email",
  message: "message",
  status: "status",
  reminderSentAt: "reminder_sent_at",
  cancelledAt: "cancelled_at",
};

const isUnique = (e: unknown) => /UNIQUE/i.test(String((e as Error)?.message ?? e));

export class LibsqlRepository implements BookingRepository {
  /** true si la base était vide au premier accès (horaires initiaux à copier) */
  createdNow = false;

  private constructor(private db: SqlExecutor) {}

  /** Crée les tables si besoin ; `createdNow` indique une base neuve */
  static async open(db: SqlExecutor): Promise<LibsqlRepository> {
    const repo = new LibsqlRepository(db);
    await db.transaction(SCHEMA_V1.map((sql) => ({ sql })));
    // Marqueur posé une seule fois : seule la première instance voit changes = 1
    const r = await db.execute(`INSERT OR IGNORE INTO app_meta (key, value) VALUES ('schema_version', '1')`);
    repo.createdNow = r.rowsAffected === 1;
    return repo;
  }

  async listAppointments(f: AppointmentFilter = {}) {
    const { rows } = await this.db.execute(
      `SELECT * FROM appointments WHERE (?1 IS NULL OR end_at > ?1) AND (?2 IS NULL OR start_at < ?2)
       ORDER BY start_at ${f.order === "desc" ? "DESC" : "ASC"}`,
      [f.from ?? null, f.to ?? null],
    );
    const list = rows.map(toAppointment).filter((a) => matchesFilter(a, f));
    return f.limit ? list.slice(0, f.limit) : list;
  }

  async getAppointment(id: string) {
    const { rows } = await this.db.execute("SELECT * FROM appointments WHERE id = ?", [id]);
    return rows[0] ? toAppointment(rows[0]) : null;
  }

  async getAppointmentByTokenHash(hash: string) {
    const { rows } = await this.db.execute("SELECT * FROM appointments WHERE management_token_hash = ?", [hash]);
    return rows[0] ? toAppointment(rows[0]) : null;
  }

  async listBusy(from: string, to: string) {
    const { rows } = await this.db.execute(
      `SELECT id, start_at, end_at FROM appointments WHERE ${ACTIVE} AND start_at < ? AND ? < end_at`,
      [to, from],
    );
    return rows.map((r) => ({ id: String(r.id), startAt: String(r.start_at), endAt: String(r.end_at) }));
  }

  async insertIfFree(a: NewAppointment): Promise<WriteResult> {
    const now = new Date().toISOString();
    const active = a.status === "PENDING" || a.status === "CONFIRMED";
    const values: SqlArg[] = [
      a.id,
      a.serviceId,
      a.serviceName,
      a.duration,
      a.startAt,
      a.endAt,
      a.firstName,
      a.lastName,
      a.phone,
      a.email,
      a.message,
      a.status,
      a.source,
      a.managementTokenHash,
      a.consentAt,
      now,
      now,
    ];
    try {
      const r = await this.db.execute(
        `INSERT INTO appointments (id, service_id, service_name, duration, start_at, end_at, first_name, last_name,
           phone, email, message, status, source, management_token_hash, consent_at, reminder_sent_at,
           created_at, updated_at, cancelled_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL
         WHERE ? = 0 OR NOT EXISTS (
           SELECT 1 FROM appointments WHERE ${ACTIVE} AND start_at < ? AND ? < end_at
         )`,
        [...values, active ? 1 : 0, a.endAt, a.startAt],
      );
      if (r.rowsAffected === 0) return { ok: false, reason: "conflict" };
      return { ok: true, appointment: { ...a, createdAt: now, updatedAt: now, cancelledAt: null, reminderSentAt: null } };
    } catch (e) {
      if (isUnique(e)) return { ok: false, reason: "conflict" };
      throw e;
    }
  }

  async updateIfFree(id: string, patch: AppointmentPatch, checkConflict: boolean): Promise<WriteResult> {
    // Verrouillage optimiste : on relit et on réessaie si la fiche a changé entre-temps
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await this.getAppointment(id);
      if (!current) return { ok: false, reason: "not_found" };
      const updatedAt = new Date(Math.max(Date.now(), Date.parse(current.updatedAt) + 1)).toISOString();
      const next: Appointment = { ...current, ...patch, updatedAt };
      const active = next.status === "PENDING" || next.status === "CONFIRMED";
      const check = checkConflict && active;

      const keys = Object.keys(patch) as (keyof AppointmentPatch)[];
      const sets = keys.map((k) => `${COLUMN[k]} = ?`).concat("updated_at = ?");
      const values = keys.map((k) => (patch[k] ?? null) as SqlArg).concat(updatedAt);
      try {
        const r = await this.db.execute(
          `UPDATE appointments SET ${sets.join(", ")}
           WHERE id = ? AND updated_at = ?
             AND (? = 0 OR NOT EXISTS (
               SELECT 1 FROM appointments o WHERE o.${ACTIVE} AND o.start_at < ? AND ? < o.end_at AND o.id <> ?
             ))`,
          [...values, id, current.updatedAt, check ? 1 : 0, next.endAt, next.startAt, id],
        );
        if (r.rowsAffected === 1) return { ok: true, appointment: next };
      } catch (e) {
        if (isUnique(e)) return { ok: false, reason: "conflict" };
        throw e;
      }
      // 0 ligne modifiée : soit conflit d'horaire, soit fiche modifiée entre-temps
      const again = await this.getAppointment(id);
      if (!again) return { ok: false, reason: "not_found" };
      if (again.updatedAt === current.updatedAt) return { ok: false, reason: "conflict" };
    }
    return { ok: false, reason: "conflict" };
  }

  async deleteAppointment(id: string) {
    const [, r] = await this.db.transaction([
      { sql: "DELETE FROM teleconsultations WHERE appointment_id = ?", args: [id] },
      { sql: "DELETE FROM appointments WHERE id = ?", args: [id] },
    ]);
    return r.rowsAffected > 0;
  }

  async setManagementTokenHash(id: string, hash: string) {
    await this.db.execute("UPDATE appointments SET management_token_hash = ? WHERE id = ?", [hash, id]);
  }

  async purgeBefore(before: string) {
    const [, r] = await this.db.transaction([
      {
        sql: "DELETE FROM teleconsultations WHERE appointment_id IN (SELECT id FROM appointments WHERE end_at < ?)",
        args: [before],
      },
      { sql: "DELETE FROM appointments WHERE end_at < ?", args: [before] },
    ]);
    return r.rowsAffected;
  }

  async getTeleconsultation(appointmentId: string) {
    const { rows } = await this.db.execute("SELECT * FROM teleconsultations WHERE appointment_id = ?", [appointmentId]);
    return rows[0] ? toTeleconsultation(rows[0]) : null;
  }

  async listTeleconsultations(appointmentIds: string[]) {
    if (appointmentIds.length === 0) return [];
    const { rows } = await this.db.execute(
      `SELECT * FROM teleconsultations WHERE appointment_id IN (${appointmentIds.map(() => "?").join(", ")})`,
      appointmentIds,
    );
    return rows.map(toTeleconsultation);
  }

  async saveTeleconsultation(t: Teleconsultation) {
    await this.db.execute(
      `INSERT INTO teleconsultations (appointment_id, provider, room_name, room_url, price_cents, patient_joined_at,
         practitioner_joined_at, issue_report, issue_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(appointment_id) DO UPDATE SET provider = excluded.provider, room_name = excluded.room_name,
         room_url = excluded.room_url, price_cents = excluded.price_cents, patient_joined_at = excluded.patient_joined_at,
         practitioner_joined_at = excluded.practitioner_joined_at, issue_report = excluded.issue_report,
         issue_at = excluded.issue_at, updated_at = excluded.updated_at`,
      [
        t.appointmentId,
        t.provider,
        t.roomName,
        t.roomUrl,
        t.priceCents,
        t.patientJoinedAt,
        t.practitionerJoinedAt,
        t.issueReport,
        t.issueAt,
        t.createdAt,
        t.updatedAt,
      ],
    );
  }

  async getSetting(key: string) {
    const { rows } = await this.db.execute("SELECT value FROM settings WHERE key = ?", [key]);
    return rows[0] ? String(rows[0].value) : null;
  }

  async setSetting(key: string, value: string) {
    await this.db.execute(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value],
    );
  }

  async listAvailability(): Promise<AvailabilityRule[]> {
    const { rows } = await this.db.execute("SELECT * FROM availability ORDER BY day_of_week, start_time");
    return rows.map((r) => ({
      id: String(r.id),
      dayOfWeek: Number(r.day_of_week),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      enabled: Number(r.enabled) === 1,
    }));
  }

  async replaceAvailability(rules: Omit<AvailabilityRule, "id">[]) {
    await this.db.transaction([
      { sql: "DELETE FROM availability" },
      ...rules.map((r) => ({
        sql: "INSERT INTO availability (id, day_of_week, start_time, end_time, enabled) VALUES (?, ?, ?, ?, ?)",
        args: [randomId(), r.dayOfWeek, r.startTime, r.endTime, r.enabled ? 1 : 0] as SqlArg[],
      })),
    ]);
    return this.listAvailability();
  }

  async listClosures(): Promise<Closure[]> {
    const { rows } = await this.db.execute("SELECT * FROM closures ORDER BY start_date");
    return rows.map((r) => ({
      id: String(r.id),
      startDate: String(r.start_date),
      endDate: String(r.end_date),
      reason: String(r.reason ?? ""),
      createdAt: String(r.created_at),
    }));
  }

  async addClosure(c: Omit<Closure, "id" | "createdAt">) {
    const full: Closure = { ...c, id: randomId(), createdAt: new Date().toISOString() };
    await this.db.execute("INSERT INTO closures (id, start_date, end_date, reason, created_at) VALUES (?, ?, ?, ?, ?)", [
      full.id,
      full.startDate,
      full.endDate,
      full.reason,
      full.createdAt,
    ]);
    return full;
  }

  async deleteClosure(id: string) {
    return (await this.db.execute("DELETE FROM closures WHERE id = ?", [id])).rowsAffected > 0;
  }

  async listUnavailabilities(from?: string, to?: string): Promise<Unavailability[]> {
    const { rows } = await this.db.execute(
      "SELECT * FROM unavailabilities WHERE (?1 IS NULL OR date >= ?1) AND (?2 IS NULL OR date <= ?2) ORDER BY date, start_time",
      [from ?? null, to ?? null],
    );
    return rows.map((r) => ({
      id: String(r.id),
      date: String(r.date),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      reason: String(r.reason ?? ""),
      createdAt: String(r.created_at),
    }));
  }

  async addUnavailability(u: Omit<Unavailability, "id" | "createdAt">) {
    const full: Unavailability = { ...u, id: randomId(), createdAt: new Date().toISOString() };
    await this.db.execute(
      "INSERT INTO unavailabilities (id, date, start_time, end_time, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [full.id, full.date, full.startTime, full.endTime, full.reason, full.createdAt],
    );
    return full;
  }

  async deleteUnavailability(id: string) {
    return (await this.db.execute("DELETE FROM unavailabilities WHERE id = ?", [id])).rowsAffected > 0;
  }

  async addNotification(type: NotificationType, appointmentId: string | null, message: string) {
    await this.db.execute(
      "INSERT INTO notifications (id, type, appointment_id, message, created_at, read_at) VALUES (?, ?, ?, ?, ?, NULL)",
      [randomId(), type, appointmentId, message, new Date().toISOString()],
    );
  }

  async listNotifications(limit = 20): Promise<AdminNotification[]> {
    const { rows } = await this.db.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?", [limit]);
    return rows.map((r) => ({
      id: String(r.id),
      type: String(r.type) as NotificationType,
      appointmentId: (r.appointment_id as string | null) ?? null,
      message: String(r.message),
      createdAt: String(r.created_at),
      readAt: (r.read_at as string | null) ?? null,
    }));
  }

  async markNotificationsRead(ids?: string[]) {
    const at = new Date().toISOString();
    if (!ids) {
      await this.db.execute("UPDATE notifications SET read_at = ? WHERE read_at IS NULL", [at]);
      return;
    }
    if (ids.length === 0) return;
    await this.db.execute(
      `UPDATE notifications SET read_at = ? WHERE read_at IS NULL AND id IN (${ids.map(() => "?").join(", ")})`,
      [at, ...ids],
    );
  }
}
