/**
 * Calcul des disponibilités — fonctions pures, sans accès aux données.
 * Utilisées côté serveur pour proposer ET pour valider une réservation.
 */
import type { BookingService } from "./config";
import { dayOfWeek, localDate, timeToMinutes, zonedToUtc, addDays, daysInMonth } from "./time";
import type { AvailabilityRule, Closure, DayAvailability, Slot, Unavailability } from "./types";

export type ScheduleRules = {
  timezone: string;
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  slotIntervalMinutes: number | null;
};

export type ScheduleData = {
  availability: AvailabilityRule[];
  closures: Closure[];
  unavailabilities: Unavailability[];
  /** Rendez-vous occupant un créneau (PENDING / CONFIRMED) */
  busy: { startAt: string; endAt: string; id?: string }[];
};

type Range = [number, number];

/** Plages d'ouverture d'une date locale, en minutes, fusionnées et triées */
export function openingRanges(date: string, availability: AvailabilityRule[]): Range[] {
  const dow = dayOfWeek(date);
  const ranges = availability
    .filter((r) => r.enabled && r.dayOfWeek === dow)
    .map((r) => [timeToMinutes(r.startTime), timeToMinutes(r.endTime)] as Range)
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

export function isClosedDate(date: string, closures: Closure[]): boolean {
  return closures.some((c) => date >= c.startDate && date <= c.endDate);
}

export function todayLocal(now: Date, tz: string): string {
  return localDate(now, tz);
}

export function lastBookableDate(now: Date, rules: ScheduleRules): string {
  return addDays(todayLocal(now, rules.timezone), rules.maximumAdvanceDays);
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

type SlotOptions = {
  /** Ignorer ce rendez-vous (déplacement d'un rendez-vous existant) */
  ignoreAppointmentId?: string;
  /** Ne pas tenir compte des rendez-vous existants (calcul de la capacité de base) */
  ignoreBusy?: boolean;
};

/**
 * Créneaux réservables pour une date locale et une prestation.
 * Tient compte : horaires, fermetures, indisponibilités, rendez-vous existants,
 * délai minimum, délai maximum, dates passées, heure d'été/hiver.
 */
export function generateSlots(
  date: string,
  service: Pick<BookingService, "duration">,
  data: ScheduleData,
  rules: ScheduleRules,
  now: Date,
  options: SlotOptions = {},
): Slot[] {
  const tz = rules.timezone;
  const today = todayLocal(now, tz);
  if (date < today || date > lastBookableDate(now, rules)) return [];
  if (isClosedDate(date, data.closures)) return [];

  const ranges = openingRanges(date, data.availability);
  if (ranges.length === 0) return [];

  const duration = service.duration;
  const step = rules.slotIntervalMinutes && rules.slotIntervalMinutes > 0 ? rules.slotIntervalMinutes : duration;
  const earliest = now.getTime() + rules.minimumNoticeMinutes * 60_000;

  const blockedMinutes: Range[] = data.unavailabilities
    .filter((u) => u.date === date)
    .map((u) => [timeToMinutes(u.startTime), timeToMinutes(u.endTime)]);

  const busy = options.ignoreBusy
    ? []
    : data.busy
        .filter((b) => b.id === undefined || b.id !== options.ignoreAppointmentId)
        .map((b) => [Date.parse(b.startAt), Date.parse(b.endAt)] as Range);

  const slots: Slot[] = [];
  for (const [open, close] of ranges) {
    for (let t = open; t + duration <= close; t += step) {
      if (blockedMinutes.some(([s, e]) => overlaps(t, t + duration, s, e))) continue;
      const start = zonedToUtc(date, t, tz);
      const end = zonedToUtc(date, t + duration, tz);
      if (!start || !end) continue; // heure inexistante (changement d'heure)
      const s = start.getTime();
      const e = end.getTime();
      if (s < earliest) continue;
      if (busy.some(([bs, be]) => overlaps(s, e, bs, be))) continue;
      slots.push({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        time: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}

/** État de chaque jour d'un mois ("YYYY-MM") pour le calendrier patient */
export function monthAvailability(
  month: string,
  service: Pick<BookingService, "duration">,
  data: ScheduleData,
  rules: ScheduleRules,
  now: Date,
): DayAvailability[] {
  const today = todayLocal(now, rules.timezone);
  const last = lastBookableDate(now, rules);
  return daysInMonth(month).map((date) => {
    if (date < today) return { date, status: "past", slots: 0 };
    if (date > last) return { date, status: "beyond", slots: 0 };
    if (isClosedDate(date, data.closures) || openingRanges(date, data.availability).length === 0) {
      return { date, status: "closed", slots: 0 };
    }
    const slots = generateSlots(date, service, data, rules, now).length;
    if (slots > 0) return { date, status: "available", slots };
    const base = generateSlots(date, service, data, rules, now, { ignoreBusy: true }).length;
    return { date, status: base > 0 ? "full" : "unavailable", slots: 0 };
  });
}
