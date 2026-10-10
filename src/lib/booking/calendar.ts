/**
 * Liens « Ajouter à mon calendrier » : Google Agenda et fichier .ics.
 * Utilisable côté navigateur et côté serveur.
 */

export type CalendarEvent = {
  uid: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  description: string;
};

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.startAt)}/${stamp(e.endAt)}`,
    details: e.description,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const escapeIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Coupe les lignes à 75 octets (RFC 5545) */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) {
      out.push(cur);
      cur = " " + ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

export function icsContent(e: CalendarEvent, status: "CONFIRMED" | "CANCELLED" = "CONFIRMED"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cabinet de kinesitherapie//Rendez-vous//FR",
    "CALSCALE:GREGORIAN",
    status === "CANCELLED" ? "METHOD:CANCEL" : "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.startAt)}`,
    `DTEND:${stamp(e.endAt)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `LOCATION:${escapeIcs(e.location)}`,
    `DESCRIPTION:${escapeIcs(e.description)}`,
    `STATUS:${status}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Rappel de rendez-vous",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
