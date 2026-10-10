/**
 * Opérations métier de la prise de rendez-vous.
 * Indépendantes du framework et du stockage : utilisées par les routes API
 * (stockage SQLite) et par les tests / l'aperçu (stockage mémoire).
 */
import { generateSlots, monthAvailability, type ScheduleData, type ScheduleRules } from "./availability";
import { bookingConfig, enabledServices, getService, reminderHoursBefore, type BookingService } from "./config";
import { formatPrice, getTeleSettings } from "@/lib/teleconsultation/settings";
import { videoConfigured } from "@/lib/video";
import type { AppointmentPatch, BookingRepository } from "./repository";
import {
  addDays,
  dayBoundsUtc,
  daysInMonth,
  formatLongDate,
  formatTime,
  isValidDate,
  isValidMonth,
  isValidTime,
  localDate,
  timeToMinutes,
  zonedToUtc,
} from "./time";
import { isTokenFormat, randomId, randomToken, sha256 } from "./tokens";
import {
  ACTIVE_STATUSES,
  APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentFilter,
  type AppointmentStatus,
  type AvailabilityRule,
  type PublicAppointment,
} from "./types";
import { normalizePatient, validatePatient, type PatientErrors } from "./validation";

export const rules: ScheduleRules = {
  timezone: bookingConfig.timezone,
  minimumNoticeMinutes: bookingConfig.minimumNoticeMinutes,
  maximumAdvanceDays: bookingConfig.maximumAdvanceDays,
  slotIntervalMinutes: bookingConfig.slotIntervalMinutes,
};
const TZ = rules.timezone;

async function loadSchedule(repo: BookingRepository, firstDate: string, lastDate: string): Promise<ScheduleData> {
  const from = dayBoundsUtc(firstDate, TZ).start.toISOString();
  const to = dayBoundsUtc(lastDate, TZ).end.toISOString();
  const [availability, closures, unavailabilities, busy] = await Promise.all([
    repo.listAvailability(),
    repo.listClosures(),
    repo.listUnavailabilities(firstDate, lastDate),
    repo.listBusy(from, to),
  ]);
  return { availability, closures, unavailabilities, busy };
}

/* ------------------------------------------------------------------------- */
/*  Patient                                                                   */
/* ------------------------------------------------------------------------- */

export type Failure<C extends string> = { ok: false; code: C; message: string; errors?: PatientErrors };

/**
 * Type de rendez-vous réservable, avec les réglages dynamiques :
 * la téléconsultation n'est proposée que si elle est activée ET qu'un fournisseur vidéo est configuré,
 * et sa durée vient des réglages de l'espace admin.
 */
export async function resolveService(repo: BookingRepository, id: string | null | undefined): Promise<BookingService | undefined> {
  const base = getService(id);
  if (!base || base.mode !== "video") return base;
  const s = await getTeleSettings(repo);
  if (!s.enabled || !videoConfigured()) return undefined;
  return { ...base, duration: s.duration, price: formatPrice(s.priceCents) };
}

/** Types de rendez-vous proposés à la réservation en ligne */
export async function bookableServices(repo: BookingRepository): Promise<BookingService[]> {
  const list = await Promise.all(enabledServices().map((s) => resolveService(repo, s.id)));
  return list.filter((s): s is BookingService => !!s);
}

export async function getMonthAvailability(repo: BookingRepository, serviceId: string, month: string, now = new Date()) {
  const service = await resolveService(repo, serviceId);
  if (!service) return { ok: false as const, code: "invalid_service", message: "Ce type de rendez-vous n'existe pas." };
  if (!isValidMonth(month)) return { ok: false as const, code: "invalid_month", message: "Mois invalide." };
  const days = daysInMonth(month);
  const data = await loadSchedule(repo, days[0], days[days.length - 1]);
  return { ok: true as const, days: monthAvailability(month, service, data, rules, now) };
}

export async function getDaySlots(repo: BookingRepository, serviceId: string, date: string, now = new Date(), ignoreAppointmentId?: string) {
  const service = await resolveService(repo, serviceId);
  if (!service) return { ok: false as const, code: "invalid_service", message: "Ce type de rendez-vous n'existe pas." };
  if (!isValidDate(date)) return { ok: false as const, code: "invalid_date", message: "Date invalide." };
  const data = await loadSchedule(repo, date, date);
  return { ok: true as const, slots: generateSlots(date, service, data, rules, now, { ignoreAppointmentId }) };
}

/** Prochain jour disponible après `date` (dans la limite de réservation) */
export async function nextAvailableDate(repo: BookingRepository, serviceId: string, date: string, now = new Date()) {
  const service = await resolveService(repo, serviceId);
  if (!service || !isValidDate(date)) return null;
  const last = addDays(localDate(now, TZ), rules.maximumAdvanceDays);
  const start = addDays(date, 1);
  if (start > last) return null;
  const data = await loadSchedule(repo, start, last);
  for (let d = start; d <= last; d = addDays(d, 1)) {
    if (generateSlots(d, service, data, rules, now).length > 0) return d;
  }
  return null;
}

/** Vérifie qu'un horaire correspond exactement à un créneau réellement disponible */
async function checkSlot(
  repo: BookingRepository,
  service: BookingService,
  startAt: string,
  now: Date,
  ignoreAppointmentId?: string,
) {
  const t = Date.parse(startAt);
  if (!Number.isFinite(t)) return null;
  const iso = new Date(t).toISOString();
  const date = localDate(iso, TZ);
  const data = await loadSchedule(repo, date, date);
  return generateSlots(date, service, data, rules, now, { ignoreAppointmentId }).find((s) => s.startAt === iso) ?? null;
}

export type BookingInput = { serviceId: unknown; startAt: unknown } & Record<string, unknown>;

export async function createBooking(repo: BookingRepository, input: BookingInput, now = new Date()) {
  const service = await resolveService(repo, typeof input.serviceId === "string" ? input.serviceId : "");
  if (!service) return fail("invalid_service", "Ce type de rendez-vous n'existe pas.");

  const patient = normalizePatient(input);
  const errors = validatePatient(patient);
  if (Object.keys(errors).length) return fail("invalid", "Certains champs sont à corriger.", errors);

  const slot = await checkSlot(repo, service, typeof input.startAt === "string" ? input.startAt : "", now);
  if (!slot) return fail("slot_unavailable", SLOT_TAKEN);

  const token = randomToken();
  const result = await repo.insertIfFree({
    id: randomId(),
    serviceId: service.id,
    serviceName: service.name,
    duration: service.duration,
    startAt: slot.startAt,
    endAt: slot.endAt,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    email: patient.email,
    message: patient.message,
    status: bookingConfig.autoConfirm ? "CONFIRMED" : "PENDING",
    source: "online",
    managementTokenHash: await sha256(token),
    consentAt: now.toISOString(),
  });
  if (!result.ok) return fail("slot_unavailable", SLOT_TAKEN);

  const a = result.appointment;
  await repo.addNotification(
    "NEW",
    a.id,
    `Nouveau rendez-vous : ${a.firstName} ${a.lastName} — ${a.serviceName}, ${formatLongDate(a.startAt, TZ)} à ${formatTime(a.startAt, TZ)}`,
  );
  return { ok: true as const, appointment: a, token };
}

export const SLOT_TAKEN = "Ce créneau vient malheureusement d'être réservé. Veuillez choisir un autre horaire.";

function fail<C extends string>(code: C, message: string, errors?: PatientErrors): Failure<C> {
  return { ok: false, code, message, ...(errors ? { errors } : {}) };
}

export function canPatientManage(a: Appointment, now = new Date()) {
  return (
    ACTIVE_STATUSES.includes(a.status) &&
    Date.parse(a.startAt) - now.getTime() > bookingConfig.cancellationDeadlineHours * 3_600_000
  );
}

export function toPublic(a: Appointment, now = new Date()): PublicAppointment {
  return {
    serviceId: a.serviceId,
    serviceName: a.serviceName,
    duration: a.duration,
    startAt: a.startAt,
    endAt: a.endAt,
    firstName: a.firstName,
    lastName: a.lastName,
    status: a.status,
    canManage: canPatientManage(a, now),
  };
}

export async function findByToken(repo: BookingRepository, token: string) {
  if (!isTokenFormat(token)) return null;
  return repo.getAppointmentByTokenHash(await sha256(token));
}

export async function cancelByToken(repo: BookingRepository, token: string, now = new Date()) {
  const a = await findByToken(repo, token);
  if (!a) return fail("not_found", "Ce rendez-vous est introuvable.");
  if (a.status === "CANCELLED") return fail("already_cancelled", "Ce rendez-vous est déjà annulé.");
  if (!canPatientManage(a, now)) return fail("too_late", deadlineMessage());
  const r = await repo.updateIfFree(a.id, { status: "CANCELLED", cancelledAt: now.toISOString() }, false);
  if (!r.ok) return fail("not_found", "Ce rendez-vous est introuvable.");
  await repo.addNotification(
    "CANCELLED",
    a.id,
    `Rendez-vous annulé par le patient : ${a.firstName} ${a.lastName} — ${formatLongDate(a.startAt, TZ)} à ${formatTime(a.startAt, TZ)}`,
  );
  return { ok: true as const, appointment: r.appointment };
}

export async function rescheduleByToken(repo: BookingRepository, token: string, startAt: unknown, now = new Date()) {
  const a = await findByToken(repo, token);
  if (!a) return fail("not_found", "Ce rendez-vous est introuvable.");
  if (!canPatientManage(a, now)) return fail("too_late", deadlineMessage());
  const base = getService(a.serviceId);
  // Téléconsultation : on garde la durée réservée, même si le réglage a changé depuis
  const service =
    base && base.mode !== "video" ? base : { id: a.serviceId, name: a.serviceName, duration: a.duration, enabled: true };
  const slot = await checkSlot(repo, service, typeof startAt === "string" ? startAt : "", now, a.id);
  if (!slot) return fail("slot_unavailable", SLOT_TAKEN);
  const previous = a.startAt;
  const r = await repo.updateIfFree(a.id, { startAt: slot.startAt, endAt: slot.endAt, reminderSentAt: null }, true);
  if (!r.ok) return fail("slot_unavailable", SLOT_TAKEN);
  await repo.addNotification(
    "RESCHEDULED",
    a.id,
    `Rendez-vous déplacé par le patient : ${a.firstName} ${a.lastName} — du ${formatLongDate(previous, TZ)} ${formatTime(
      previous,
      TZ,
    )} au ${formatLongDate(slot.startAt, TZ)} ${formatTime(slot.startAt, TZ)}`,
  );
  return { ok: true as const, appointment: r.appointment, previousStartAt: previous };
}

function deadlineMessage() {
  return `Ce rendez-vous ne peut plus être modifié en ligne moins de ${bookingConfig.cancellationDeadlineHours} heures à l'avance. Merci d'appeler le cabinet.`;
}

/** Rendez-vous pour l'espace admin (sans l'empreinte du jeton) */
export function toAdmin(a: Appointment): Omit<Appointment, "managementTokenHash"> {
  const { managementTokenHash: _hash, ...rest } = a;
  void _hash;
  return rest;
}

/* ------------------------------------------------------------------------- */
/*  Administration                                                            */
/* ------------------------------------------------------------------------- */

const isStatus = (s: unknown): s is AppointmentStatus => APPOINTMENT_STATUSES.includes(s as AppointmentStatus);

export function parseFilter(params: URLSearchParams): AppointmentFilter {
  const f: AppointmentFilter = {};
  const from = params.get("from");
  const to = params.get("to");
  if (from && isValidDate(from)) f.from = dayBoundsUtc(from, TZ).start.toISOString();
  if (to && isValidDate(to)) f.to = dayBoundsUtc(to, TZ).end.toISOString();
  const statuses = (params.get("status") ?? "").split(",").filter(isStatus);
  if (statuses.length) f.statuses = statuses;
  const service = params.get("service");
  if (service && bookingConfig.services.some((s) => s.id === service)) f.serviceId = service;
  const q = (params.get("q") ?? "").trim().slice(0, 80);
  if (q) f.query = q;
  const limit = Number(params.get("limit"));
  if (Number.isInteger(limit) && limit > 0) f.limit = Math.min(limit, 500);
  if (params.get("order") === "desc") f.order = "desc";
  return f;
}

type AdminInput = Record<string, unknown>;

function resolveAdminTime(input: AdminInput, fallbackDuration?: number) {
  const date = typeof input.date === "string" ? input.date : "";
  const time = typeof input.time === "string" ? input.time : "";
  if (!isValidDate(date)) return { error: "Choisissez une date valide." };
  if (!isValidTime(time)) return { error: "Choisissez une heure valide (HH:MM)." };
  const duration = Number(input.duration ?? fallbackDuration);
  if (!Number.isInteger(duration) || duration < 5 || duration > 480) return { error: "La durée doit être comprise entre 5 et 480 minutes." };
  const start = zonedToUtc(date, timeToMinutes(time), TZ);
  if (!start) return { error: "Cette heure n'existe pas ce jour-là (changement d'heure)." };
  const end = new Date(start.getTime() + duration * 60_000);
  return { startAt: start.toISOString(), endAt: end.toISOString(), duration };
}

export async function adminCreate(repo: BookingRepository, input: AdminInput) {
  const service = bookingConfig.services.find((s) => s.id === input.serviceId);
  if (!service) return fail("invalid_service", "Choisissez un type de rendez-vous.");
  const patient = normalizePatient(input);
  const errors = validatePatient(patient, { requireConsent: false });
  if (Object.keys(errors).length) return fail("invalid", "Certains champs sont à corriger.", errors);
  const time = resolveAdminTime(input, service.duration);
  if ("error" in time) return fail("invalid_time", time.error as string);
  const status = isStatus(input.status) ? input.status : "CONFIRMED";
  const r = await repo.insertIfFree({
    id: randomId(),
    serviceId: service.id,
    serviceName: service.name,
    duration: time.duration,
    startAt: time.startAt,
    endAt: time.endAt,
    ...patient,
    status,
    source: "admin",
    managementTokenHash: await sha256(randomToken()),
    consentAt: null,
  });
  if (!r.ok) return fail("conflict", "Ce créneau chevauche un autre rendez-vous.");
  return { ok: true as const, appointment: r.appointment };
}

export async function adminUpdate(repo: BookingRepository, id: string, input: AdminInput, now = new Date()) {
  const current = await repo.getAppointment(id);
  if (!current) return fail("not_found", "Rendez-vous introuvable.");
  const patch: AppointmentPatch = {};

  if (input.serviceId !== undefined) {
    const service = bookingConfig.services.find((s) => s.id === input.serviceId);
    if (!service) return fail("invalid_service", "Choisissez un type de rendez-vous.");
    patch.serviceId = service.id;
    patch.serviceName = service.name;
  }
  const hasPatientFields = ["firstName", "lastName", "phone", "email", "message"].some((k) => input[k] !== undefined);
  if (hasPatientFields) {
    const patient = normalizePatient({ ...current, ...input });
    const errors = validatePatient(patient, { requireConsent: false });
    if (Object.keys(errors).length) return fail("invalid", "Certains champs sont à corriger.", errors);
    Object.assign(patch, {
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      email: patient.email,
      message: patient.message,
    });
  }
  let moved = false;
  if (input.date !== undefined || input.time !== undefined || input.duration !== undefined) {
    const t = resolveAdminTime(
      {
        date: input.date ?? localDate(current.startAt, TZ),
        time: input.time ?? formatTime(current.startAt, TZ).replace("h", ":"),
        duration: input.duration ?? current.duration,
      },
      current.duration,
    );
    if ("error" in t) return fail("invalid_time", t.error as string);
    moved = t.startAt !== current.startAt;
    Object.assign(patch, { startAt: t.startAt, endAt: t.endAt, duration: t.duration });
    if (moved) patch.reminderSentAt = null;
  }
  if (input.status !== undefined) {
    if (!isStatus(input.status)) return fail("invalid_status", "Statut invalide.");
    patch.status = input.status;
    patch.cancelledAt = input.status === "CANCELLED" ? (current.cancelledAt ?? now.toISOString()) : null;
  }
  const r = await repo.updateIfFree(id, patch, true);
  if (!r.ok) return r.reason === "conflict" ? fail("conflict", "Ce créneau chevauche un autre rendez-vous.") : fail("not_found", "Rendez-vous introuvable.");
  return { ok: true as const, appointment: r.appointment, moved, previous: current };
}

export async function adminDashboard(repo: BookingRepository, now = new Date()) {
  const today = localDate(now, TZ);
  const { start, end } = dayBoundsUtc(today, TZ);
  const todays = await repo.listAppointments({ from: start.toISOString(), to: end.toISOString() });
  const byService: Record<string, number> = {};
  for (const a of todays) if (a.status !== "CANCELLED") byService[a.serviceName] = (byService[a.serviceName] ?? 0) + 1;
  const upcoming = await repo.listAppointments({ from: now.toISOString(), statuses: ["PENDING", "CONFIRMED"], limit: 8 });
  const notifications = await repo.listNotifications(15);
  return {
    today,
    total: todays.filter((a) => a.status !== "CANCELLED").length,
    cancelled: todays.filter((a) => a.status === "CANCELLED").length,
    pending: todays.filter((a) => a.status === "PENDING").length,
    byService,
    todays,
    upcoming,
    notifications,
  };
}

export async function adminReplaceAvailability(repo: BookingRepository, input: unknown) {
  if (!Array.isArray(input)) return fail("invalid", "Données invalides.");
  const rulesIn: Omit<AvailabilityRule, "id">[] = [];
  for (const r of input) {
    const dayOfWeek = Number(r?.dayOfWeek);
    const startTime = String(r?.startTime ?? "");
    const endTime = String(r?.endTime ?? "");
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return fail("invalid", "Jour invalide.");
    if (!isValidTime(startTime) || !isValidTime(endTime)) return fail("invalid", "Heure invalide (format HH:MM).");
    if (timeToMinutes(endTime) <= timeToMinutes(startTime))
      return fail("invalid", "L'heure de fin doit être après l'heure de début.");
    rulesIn.push({ dayOfWeek, startTime, endTime, enabled: r?.enabled !== false });
  }
  if (rulesIn.length > 70) return fail("invalid", "Trop de plages horaires.");
  return { ok: true as const, availability: await repo.replaceAvailability(rulesIn) };
}

export async function adminAddClosure(repo: BookingRepository, input: AdminInput) {
  const startDate = String(input.startDate ?? "");
  const endDate = String(input.endDate ?? input.startDate ?? "");
  if (!isValidDate(startDate) || !isValidDate(endDate)) return fail("invalid", "Choisissez des dates valides.");
  if (endDate < startDate) return fail("invalid", "La date de fin doit être après la date de début.");
  const reason = String(input.reason ?? "").trim().slice(0, 120);
  return { ok: true as const, closure: await repo.addClosure({ startDate, endDate, reason }) };
}

export async function adminAddUnavailability(repo: BookingRepository, input: AdminInput) {
  const date = String(input.date ?? "");
  const startTime = String(input.startTime ?? "");
  const endTime = String(input.endTime ?? "");
  if (!isValidDate(date)) return fail("invalid", "Choisissez une date valide.");
  if (!isValidTime(startTime) || !isValidTime(endTime)) return fail("invalid", "Heures invalides (format HH:MM).");
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return fail("invalid", "L'heure de fin doit être après l'heure de début.");
  const reason = String(input.reason ?? "").trim().slice(0, 120);
  return { ok: true as const, unavailability: await repo.addUnavailability({ date, startTime, endTime, reason }) };
}

/** Rendez-vous à rappeler : actifs, commençant dans la fenêtre du rappel, pas encore rappelés */
export async function dueReminders(repo: BookingRepository, now = new Date()) {
  const to = new Date(now.getTime() + reminderHoursBefore() * 3_600_000).toISOString();
  const list = await repo.listAppointments({ from: now.toISOString(), to, statuses: ["PENDING", "CONFIRMED"] });
  return list.filter((a) => !a.reminderSentAt && a.startAt > now.toISOString());
}

export async function purgeExpired(repo: BookingRepository, now = new Date()) {
  const before = new Date(now.getTime() - bookingConfig.dataRetentionDays * 86_400_000).toISOString();
  return repo.purgeBefore(before);
}

/**
 * « J'ai perdu mon lien » : retrouve les rendez-vous à venir liés à une adresse e-mail
 * et crée un nouveau lien de gestion pour chacun (l'ancien lien cesse de fonctionner).
 * Ne renvoie rien si l'adresse ne correspond à aucun rendez-vous.
 */
export async function reissueManageLinks(repo: BookingRepository, rawEmail: string, now = new Date()) {
  const email = rawEmail.trim().toLowerCase();
  const upcoming = await repo.listAppointments({ from: now.toISOString(), statuses: ["PENDING", "CONFIRMED"] });
  const mine = upcoming.filter((a) => a.email.toLowerCase() === email && a.startAt > now.toISOString()).slice(0, 5);
  const out: { appointment: Appointment; token: string }[] = [];
  for (const a of mine) {
    const token = randomToken();
    await repo.setManagementTokenHash(a.id, await sha256(token));
    out.push({ appointment: a, token });
  }
  return out;
}
