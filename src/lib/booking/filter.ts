import type { Appointment, AppointmentFilter } from "./types";

/** Filtre de recherche commun aux deux stockages */
export function matchesFilter(a: Appointment, f: AppointmentFilter): boolean {
  if (f.from && a.endAt <= f.from) return false;
  if (f.to && a.startAt >= f.to) return false;
  if (f.statuses && f.statuses.length && !f.statuses.includes(a.status)) return false;
  if (f.serviceId && a.serviceId !== f.serviceId) return false;
  if (f.query) {
    const q = f.query.toLowerCase().replace(/\s+/g, " ").trim();
    const hay = [a.firstName, a.lastName, `${a.firstName} ${a.lastName}`, `${a.lastName} ${a.firstName}`, a.email]
      .join(" | ")
      .toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    const phoneMatch = qDigits.length >= 4 && a.phone.replace(/\D/g, "").includes(qDigits);
    if (!hay.includes(q) && !phoneMatch) return false;
  }
  return true;
}
