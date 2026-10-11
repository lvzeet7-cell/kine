/**
 * Stockage en mémoire — pour les tests automatisés et l'aperçu hors serveur.
 * Ne pas utiliser en production (les données disparaissent au redémarrage).
 */
import type { AppointmentPatch, BookingRepository, NewAppointment, WriteResult } from "./repository";
import { randomId } from "./tokens";
import { matchesFilter } from "./filter";
import {
  ACTIVE_STATUSES,
  type AdminNotification,
  type Appointment,
  type AppointmentFilter,
  type AvailabilityRule,
  type Closure,
  type NotificationType,
  type Teleconsultation,
  type Unavailability,
} from "./types";

const nowIso = () => new Date().toISOString();

export class MemoryRepository implements BookingRepository {
  appointments: Appointment[] = [];
  availability: AvailabilityRule[] = [];
  closures: Closure[] = [];
  unavailabilities: Unavailability[] = [];
  notifications: AdminNotification[] = [];
  teleconsultations: Teleconsultation[] = [];
  settings: Record<string, string> = {};

  constructor(initialAvailability: Omit<AvailabilityRule, "id">[] = []) {
    this.availability = initialAvailability.map((r) => ({ ...r, id: randomId() }));
  }

  private conflict(startAt: string, endAt: string, ignoreId?: string) {
    return this.appointments.some(
      (a) => a.id !== ignoreId && ACTIVE_STATUSES.includes(a.status) && a.startAt < endAt && startAt < a.endAt,
    );
  }

  async listAppointments(f: AppointmentFilter = {}) {
    const list = this.appointments.filter((a) => matchesFilter(a, f)).sort((a, b) => a.startAt.localeCompare(b.startAt));
    if (f.order === "desc") list.reverse();
    return (f.limit ? list.slice(0, f.limit) : list).map((a) => ({ ...a }));
  }
  async getAppointment(id: string) {
    const a = this.appointments.find((x) => x.id === id);
    return a ? { ...a } : null;
  }
  async getAppointmentByTokenHash(hash: string) {
    const a = this.appointments.find((x) => x.managementTokenHash === hash);
    return a ? { ...a } : null;
  }
  async listBusy(from: string, to: string) {
    return this.appointments
      .filter((a) => ACTIVE_STATUSES.includes(a.status) && a.startAt < to && from < a.endAt)
      .map(({ id, startAt, endAt }) => ({ id, startAt, endAt }));
  }
  async insertIfFree(appt: NewAppointment): Promise<WriteResult> {
    if (ACTIVE_STATUSES.includes(appt.status) && this.conflict(appt.startAt, appt.endAt)) return { ok: false, reason: "conflict" };
    const now = nowIso();
    const full: Appointment = { ...appt, createdAt: now, updatedAt: now, cancelledAt: null, reminderSentAt: null };
    this.appointments.push(full);
    return { ok: true, appointment: { ...full } };
  }
  async updateIfFree(id: string, patch: AppointmentPatch, checkConflict: boolean): Promise<WriteResult> {
    const a = this.appointments.find((x) => x.id === id);
    if (!a) return { ok: false, reason: "not_found" };
    const next = { ...a, ...patch, updatedAt: nowIso() };
    if (checkConflict && ACTIVE_STATUSES.includes(next.status) && this.conflict(next.startAt, next.endAt, id)) {
      return { ok: false, reason: "conflict" };
    }
    Object.assign(a, next);
    return { ok: true, appointment: { ...a } };
  }
  async deleteAppointment(id: string) {
    const n = this.appointments.length;
    this.appointments = this.appointments.filter((a) => a.id !== id);
    this.teleconsultations = this.teleconsultations.filter((t) => t.appointmentId !== id);
    return this.appointments.length < n;
  }
  async setManagementTokenHash(id: string, hash: string) {
    const a = this.appointments.find((x) => x.id === id);
    if (a) a.managementTokenHash = hash;
  }
  async purgeBefore(before: string) {
    const n = this.appointments.length;
    this.appointments = this.appointments.filter((a) => a.endAt >= before);
    const ids = new Set(this.appointments.map((a) => a.id));
    this.teleconsultations = this.teleconsultations.filter((t) => ids.has(t.appointmentId));
    return n - this.appointments.length;
  }

  async listAvailability() {
    return [...this.availability].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  }
  async replaceAvailability(rules: Omit<AvailabilityRule, "id">[]) {
    this.availability = rules.map((r) => ({ ...r, id: randomId() }));
    return this.listAvailability();
  }

  async listClosures() {
    return [...this.closures].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
  async addClosure(c: Omit<Closure, "id" | "createdAt">) {
    const full = { ...c, id: randomId(), createdAt: nowIso() };
    this.closures.push(full);
    return full;
  }
  async deleteClosure(id: string) {
    const n = this.closures.length;
    this.closures = this.closures.filter((c) => c.id !== id);
    return this.closures.length < n;
  }

  async listUnavailabilities(from?: string, to?: string) {
    return this.unavailabilities
      .filter((u) => (!from || u.date >= from) && (!to || u.date <= to))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }
  async addUnavailability(u: Omit<Unavailability, "id" | "createdAt">) {
    const full = { ...u, id: randomId(), createdAt: nowIso() };
    this.unavailabilities.push(full);
    return full;
  }
  async deleteUnavailability(id: string) {
    const n = this.unavailabilities.length;
    this.unavailabilities = this.unavailabilities.filter((u) => u.id !== id);
    return this.unavailabilities.length < n;
  }

  async getTeleconsultation(appointmentId: string) {
    const t = this.teleconsultations.find((x) => x.appointmentId === appointmentId);
    return t ? { ...t } : null;
  }
  async listTeleconsultations(appointmentIds: string[]) {
    const ids = new Set(appointmentIds);
    return this.teleconsultations.filter((t) => ids.has(t.appointmentId)).map((t) => ({ ...t }));
  }
  async saveTeleconsultation(t: Teleconsultation) {
    this.teleconsultations = this.teleconsultations.filter((x) => x.appointmentId !== t.appointmentId).concat({ ...t });
  }
  async getSetting(key: string) {
    return key in this.settings ? this.settings[key] : null;
  }
  async setSetting(key: string, value: string) {
    this.settings[key] = value;
  }

  hits: { bucket: string; at: number }[] = [];
  async recordHit(bucket: string, now: number, since: number) {
    this.hits = this.hits.filter((h) => !(h.bucket === bucket && h.at < since));
    this.hits.push({ bucket, at: now });
    return this.hits.filter((h) => h.bucket === bucket && h.at >= since).length;
  }
  async purgeHits(before: number) {
    const n = this.hits.length;
    this.hits = this.hits.filter((h) => h.at >= before);
    return n - this.hits.length;
  }

  async addNotification(type: NotificationType, appointmentId: string | null, message: string) {
    this.notifications.unshift({ id: randomId(), type, appointmentId, message, createdAt: nowIso(), readAt: null });
  }
  async listNotifications(limit = 20) {
    return this.notifications.slice(0, limit).map((n) => ({ ...n }));
  }
  async markNotificationsRead(ids?: string[]) {
    const at = nowIso();
    for (const n of this.notifications) if (!ids || ids.includes(n.id)) n.readAt ??= at;
  }
}
