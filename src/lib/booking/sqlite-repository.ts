/**
 * Stockage SQLite (production) — module intégré à Node.js (`node:sqlite`, Node ≥ 22.13),
 * aucune dépendance à installer. Un seul fichier de base de données, sauvegardable
 * par simple copie. Serveur uniquement.
 *
 * Anti double réservation :
 * 1. transaction `BEGIN IMMEDIATE` (verrou d'écriture exclusif) : vérification du
 *    chevauchement + insertion sont atomiques, même entre plusieurs processus ;
 * 2. index unique partiel sur l'heure de début des rendez-vous actifs (garde-fou).
 */
import type { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { matchesFilter } from "./filter";
import { toTeleconsultation } from "./tele-row";
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

type SqlValue = null | number | bigint | string | Uint8Array;
type Row = Record<string, SqlValue>;

const MIGRATIONS: string[] = [
  // v1 — schéma initial
  `
  CREATE TABLE appointments (
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
  );
  CREATE INDEX appointments_start ON appointments(start_at);
  CREATE UNIQUE INDEX appointments_active_start ON appointments(start_at)
    WHERE status IN ('PENDING','CONFIRMED');

  CREATE TABLE availability (
    id TEXT PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE closures (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE unavailabilities (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE INDEX unavailabilities_date ON unavailabilities(date);

  CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    appointment_id TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT
  );
  `,
  // v2 — téléconsultations et réglages (ajout de tables, aucune donnée existante modifiée)
  `
  CREATE TABLE teleconsultations (
    appointment_id TEXT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
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
  );
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  // v3 — limitation des tentatives (connexion admin, réservations, formulaires) ; clés anonymisées (empreintes)
  `
  CREATE TABLE rate_hits (
    bucket TEXT NOT NULL,
    at INTEGER NOT NULL
  );
  CREATE INDEX rate_hits_bucket_at ON rate_hits(bucket, at);
  `,
];

function toAppointment(r: Record<string, unknown>): Appointment {
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

export class SqliteRepository implements BookingRepository {
  private db: DatabaseSync;
  /** true si la base vient d'être créée (première exécution) */
  readonly createdNow: boolean;

  constructor(file: string) {
    // Chargement à l'exécution : le module intégré n'est pas embarqué par le bundler
    const { DatabaseSync } = (process as unknown as { getBuiltinModule(id: string): unknown }).getBuiltinModule(
      "node:sqlite",
    ) as typeof import("node:sqlite");
    if (file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    this.db = new DatabaseSync(file);
    // Délai d'attente d'abord : plusieurs processus peuvent ouvrir la base en même temps
    this.db.exec("PRAGMA busy_timeout = 5000");
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    this.createdNow = this.migrate() === 0;
  }

  /**
   * Applique les migrations manquantes ; renvoie la version initiale.
   * La version est relue dans la transaction : plusieurs processus peuvent démarrer en même temps.
   */
  private migrate(): number {
    const read = () => Number((this.db.prepare("PRAGMA user_version").get() as Row).user_version ?? 0);
    let initial = -1;
    for (let v = read(); v < MIGRATIONS.length; v++) {
      this.tx(() => {
        const current = read();
        if (initial === -1) initial = current;
        if (current > v) return; // déjà appliquée par un autre processus
        this.db.exec(MIGRATIONS[v]);
        this.db.exec(`PRAGMA user_version = ${v + 1}`);
      });
    }
    return initial === -1 ? read() : initial;
  }

  /** Transaction avec verrou d'écriture immédiat */
  private tx<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  private hasConflict(startAt: string, endAt: string, ignoreId: string | null): boolean {
    const row = this.db
      .prepare(
        `SELECT 1 FROM appointments
         WHERE status IN ('PENDING','CONFIRMED') AND start_at < ? AND ? < end_at AND (? IS NULL OR id <> ?)
         LIMIT 1`,
      )
      .get(endAt, startAt, ignoreId, ignoreId);
    return !!row;
  }

  async listAppointments(f: AppointmentFilter = {}) {
    const rows = this.db
      .prepare(
        `SELECT * FROM appointments WHERE (? IS NULL OR end_at > ?) AND (? IS NULL OR start_at < ?) ORDER BY start_at ${
          f.order === "desc" ? "DESC" : "ASC"
        }`,
      )
      .all(f.from ?? null, f.from ?? null, f.to ?? null, f.to ?? null) as Record<string, unknown>[];
    const list = rows.map(toAppointment).filter((a) => matchesFilter(a, f));
    return f.limit ? list.slice(0, f.limit) : list;
  }

  async getAppointment(id: string) {
    const r = this.db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return r ? toAppointment(r) : null;
  }

  async getAppointmentByTokenHash(hash: string) {
    const r = this.db.prepare("SELECT * FROM appointments WHERE management_token_hash = ?").get(hash) as
      | Record<string, unknown>
      | undefined;
    return r ? toAppointment(r) : null;
  }

  async listBusy(from: string, to: string) {
    return (
      this.db
        .prepare(
          `SELECT id, start_at, end_at FROM appointments
           WHERE status IN ('PENDING','CONFIRMED') AND start_at < ? AND ? < end_at`,
        )
        .all(to, from) as Record<string, unknown>[]
    ).map((r) => ({ id: String(r.id), startAt: String(r.start_at), endAt: String(r.end_at) }));
  }

  async insertIfFree(a: NewAppointment): Promise<WriteResult> {
    const now = new Date().toISOString();
    try {
      return this.tx(() => {
        if ((a.status === "PENDING" || a.status === "CONFIRMED") && this.hasConflict(a.startAt, a.endAt, null)) {
          return { ok: false, reason: "conflict" } as WriteResult;
        }
        this.db
          .prepare(
            `INSERT INTO appointments (id, service_id, service_name, duration, start_at, end_at, first_name, last_name,
              phone, email, message, status, source, management_token_hash, consent_at, reminder_sent_at,
              created_at, updated_at, cancelled_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
          )
          .run(
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
          );
        return {
          ok: true,
          appointment: { ...a, createdAt: now, updatedAt: now, cancelledAt: null, reminderSentAt: null },
        } as WriteResult;
      });
    } catch (e) {
      if (String((e as Error).message).includes("UNIQUE")) return { ok: false, reason: "conflict" };
      throw e;
    }
  }

  async updateIfFree(id: string, patch: AppointmentPatch, checkConflict: boolean): Promise<WriteResult> {
    try {
      return this.tx(() => {
        const current = this.db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as
          | Record<string, unknown>
          | undefined;
        if (!current) return { ok: false, reason: "not_found" } as WriteResult;
        const next: Appointment = { ...toAppointment(current), ...patch, updatedAt: new Date().toISOString() };
        const active = next.status === "PENDING" || next.status === "CONFIRMED";
        if (checkConflict && active && this.hasConflict(next.startAt, next.endAt, id)) {
          return { ok: false, reason: "conflict" } as WriteResult;
        }
        const keys = Object.keys(patch) as (keyof AppointmentPatch)[];
        const sets = keys.map((k) => `${COLUMN[k]} = ?`).concat("updated_at = ?");
        const values = keys.map((k) => (patch[k] ?? null) as SqlValue).concat(next.updatedAt);
        this.db.prepare(`UPDATE appointments SET ${sets.join(", ")} WHERE id = ?`).run(...values, id);
        return { ok: true, appointment: next } as WriteResult;
      });
    } catch (e) {
      if (String((e as Error).message).includes("UNIQUE")) return { ok: false, reason: "conflict" };
      throw e;
    }
  }

  async deleteAppointment(id: string) {
    this.db.prepare("DELETE FROM teleconsultations WHERE appointment_id = ?").run(id);
    return Number(this.db.prepare("DELETE FROM appointments WHERE id = ?").run(id).changes) > 0;
  }

  async setManagementTokenHash(id: string, hash: string) {
    this.db.prepare("UPDATE appointments SET management_token_hash = ? WHERE id = ?").run(hash, id);
  }

  async purgeBefore(before: string) {
    return this.tx(() => {
      this.db
        .prepare("DELETE FROM teleconsultations WHERE appointment_id IN (SELECT id FROM appointments WHERE end_at < ?)")
        .run(before);
      return Number(this.db.prepare("DELETE FROM appointments WHERE end_at < ?").run(before).changes);
    });
  }

  async getTeleconsultation(appointmentId: string) {
    const r = this.db.prepare("SELECT * FROM teleconsultations WHERE appointment_id = ?").get(appointmentId) as
      | Record<string, unknown>
      | undefined;
    return r ? toTeleconsultation(r) : null;
  }

  async listTeleconsultations(appointmentIds: string[]) {
    if (appointmentIds.length === 0) return [];
    const rows = this.db
      .prepare(`SELECT * FROM teleconsultations WHERE appointment_id IN (${appointmentIds.map(() => "?").join(", ")})`)
      .all(...appointmentIds) as Record<string, unknown>[];
    return rows.map(toTeleconsultation);
  }

  async saveTeleconsultation(t: Teleconsultation) {
    this.db
      .prepare(
        `INSERT INTO teleconsultations (appointment_id, provider, room_name, room_url, price_cents, patient_joined_at,
           practitioner_joined_at, issue_report, issue_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(appointment_id) DO UPDATE SET provider = excluded.provider, room_name = excluded.room_name,
           room_url = excluded.room_url, price_cents = excluded.price_cents, patient_joined_at = excluded.patient_joined_at,
           practitioner_joined_at = excluded.practitioner_joined_at, issue_report = excluded.issue_report,
           issue_at = excluded.issue_at, updated_at = excluded.updated_at`,
      )
      .run(
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
      );
  }

  async getSetting(key: string) {
    const r = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as Row | undefined;
    return r ? String(r.value) : null;
  }

  async setSetting(key: string, value: string) {
    this.db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(key, value);
  }

  async recordHit(bucket: string, now: number, since: number) {
    return this.tx(() => {
      this.db.prepare("DELETE FROM rate_hits WHERE bucket = ? AND at < ?").run(bucket, since);
      this.db.prepare("INSERT INTO rate_hits (bucket, at) VALUES (?, ?)").run(bucket, now);
      const r = this.db.prepare("SELECT COUNT(*) AS n FROM rate_hits WHERE bucket = ? AND at >= ?").get(bucket, since) as Row;
      return Number(r.n);
    });
  }

  async purgeHits(before: number) {
    return Number(this.db.prepare("DELETE FROM rate_hits WHERE at < ?").run(before).changes);
  }

  async listAvailability(): Promise<AvailabilityRule[]> {
    return (
      this.db.prepare("SELECT * FROM availability ORDER BY day_of_week, start_time").all() as Record<string, unknown>[]
    ).map((r) => ({
      id: String(r.id),
      dayOfWeek: Number(r.day_of_week),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      enabled: Number(r.enabled) === 1,
    }));
  }

  async replaceAvailability(rules: Omit<AvailabilityRule, "id">[]) {
    this.tx(() => {
      this.db.exec("DELETE FROM availability");
      const ins = this.db.prepare(
        "INSERT INTO availability (id, day_of_week, start_time, end_time, enabled) VALUES (?, ?, ?, ?, ?)",
      );
      for (const r of rules) ins.run(randomId(), r.dayOfWeek, r.startTime, r.endTime, r.enabled ? 1 : 0);
    });
    return this.listAvailability();
  }

  async listClosures(): Promise<Closure[]> {
    return (this.db.prepare("SELECT * FROM closures ORDER BY start_date").all() as Record<string, unknown>[]).map(
      (r) => ({
        id: String(r.id),
        startDate: String(r.start_date),
        endDate: String(r.end_date),
        reason: String(r.reason ?? ""),
        createdAt: String(r.created_at),
      }),
    );
  }

  async addClosure(c: Omit<Closure, "id" | "createdAt">) {
    const full: Closure = { ...c, id: randomId(), createdAt: new Date().toISOString() };
    this.db
      .prepare("INSERT INTO closures (id, start_date, end_date, reason, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(full.id, full.startDate, full.endDate, full.reason, full.createdAt);
    return full;
  }

  async deleteClosure(id: string) {
    return Number(this.db.prepare("DELETE FROM closures WHERE id = ?").run(id).changes) > 0;
  }

  async listUnavailabilities(from?: string, to?: string): Promise<Unavailability[]> {
    return (
      this.db
        .prepare(
          "SELECT * FROM unavailabilities WHERE (? IS NULL OR date >= ?) AND (? IS NULL OR date <= ?) ORDER BY date, start_time",
        )
        .all(from ?? null, from ?? null, to ?? null, to ?? null) as Record<string, unknown>[]
    ).map((r) => ({
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
    this.db
      .prepare(
        "INSERT INTO unavailabilities (id, date, start_time, end_time, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(full.id, full.date, full.startTime, full.endTime, full.reason, full.createdAt);
    return full;
  }

  async deleteUnavailability(id: string) {
    return Number(this.db.prepare("DELETE FROM unavailabilities WHERE id = ?").run(id).changes) > 0;
  }

  async addNotification(type: NotificationType, appointmentId: string | null, message: string) {
    this.db
      .prepare("INSERT INTO notifications (id, type, appointment_id, message, created_at, read_at) VALUES (?, ?, ?, ?, ?, NULL)")
      .run(randomId(), type, appointmentId, message, new Date().toISOString());
  }

  async listNotifications(limit = 20): Promise<AdminNotification[]> {
    return (
      this.db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?").all(limit) as Record<string, unknown>[]
    ).map((r) => ({
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
      this.db.prepare("UPDATE notifications SET read_at = ? WHERE read_at IS NULL").run(at);
      return;
    }
    const upd = this.db.prepare("UPDATE notifications SET read_at = ? WHERE id = ? AND read_at IS NULL");
    for (const id of ids) upd.run(at, id);
  }
}
