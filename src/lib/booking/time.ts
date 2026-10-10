/**
 * Gestion des dates et heures dans le fuseau du cabinet (Europe/Paris),
 * sans dépendance : conversions exactes via Intl, heure d'été/hiver comprise.
 *
 * Conventions :
 * - "date locale" = chaîne "YYYY-MM-DD" dans le fuseau du cabinet
 * - "heure locale" = chaîne "HH:MM" ou minutes depuis minuit
 * - instants = chaînes ISO 8601 UTC (ex. 2026-10-14T12:30:00.000Z)
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const partsFormatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string) {
  let f = partsFormatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatters.set(tz, f);
  }
  return f;
}

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

export function zonedParts(instant: Date, tz: string): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter(tz).formatToParts(instant)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return { year: out.year, month: out.month, day: out.day, hour: out.hour % 24, minute: out.minute, second: out.second };
}

/** Décalage du fuseau (ms) à un instant donné */
function offsetAt(instant: number, tz: string): number {
  const p = zonedParts(new Date(instant), tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

export function isValidDate(date: string): boolean {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function isValidTime(time: string): boolean {
  return TIME_RE.test(time);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/**
 * Convertit une date + heure locales en instant UTC.
 * Retourne null si l'heure n'existe pas (passage à l'heure d'été).
 */
export function zonedToUtc(date: string, minutes: number, tz: string): Date | null {
  const [y, mo, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60);
  let guess = wall - offsetAt(wall, tz);
  guess = wall - offsetAt(guess, tz);
  const p = zonedParts(new Date(guess), tz);
  const back = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return back === wall ? new Date(guess) : null;
}

/** Date locale "YYYY-MM-DD" d'un instant */
export function localDate(instant: Date | string, tz: string): string {
  const p = zonedParts(typeof instant === "string" ? new Date(instant) : instant, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Heure locale "HH:MM" d'un instant */
export function localTime(instant: Date | string, tz: string): string {
  const p = zonedParts(typeof instant === "string" ? new Date(instant) : instant, tz);
  return minutesToTime(p.hour * 60 + p.minute);
}

/** Jour de la semaine d'une date locale (0 = dimanche) */
export function dayOfWeek(date: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function daysInMonth(month: string): string[] {
  const [y, mo] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

export function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

/** Début (inclus) et fin (exclue) d'une journée locale, en instants UTC */
export function dayBoundsUtc(date: string, tz: string): { start: Date; end: Date } {
  const start = zonedToUtc(date, 0, tz) ?? zonedToUtc(date, 60, tz)!;
  const next = addDays(date, 1);
  const end = zonedToUtc(next, 0, tz) ?? zonedToUtc(next, 60, tz)!;
  return { start, end };
}

const longDate = new Map<string, Intl.DateTimeFormat>();
/** « mardi 14 octobre 2026 » */
export function formatLongDate(instant: Date | string, tz: string): string {
  let f = longDate.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("fr-FR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" });
    longDate.set(tz, f);
  }
  return f.format(typeof instant === "string" ? new Date(instant) : instant);
}

/** « 14h30 » */
export function formatTime(instant: Date | string, tz: string): string {
  return localTime(instant, tz).replace(":", "h");
}

/** Date locale "YYYY-MM-DD" → « mardi 14 octobre 2026 » (sans conversion de fuseau) */
export function formatLocalDate(date: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(Date.UTC(y, mo - 1, d)),
  );
}
