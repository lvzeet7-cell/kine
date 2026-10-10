/**
 * Horaires affichés sur le site : lus depuis la base (modifiables dans l'espace admin),
 * avec repli sur src/data/site.ts si la base est indisponible.
 */
import { SITE, type OpeningDay } from "@/data/site";
import { getRepo } from "./server";

const DAYS: { day: string; schemaDay: OpeningDay["schemaDay"]; dow: number }[] = [
  { day: "Lundi", schemaDay: "Monday", dow: 1 },
  { day: "Mardi", schemaDay: "Tuesday", dow: 2 },
  { day: "Mercredi", schemaDay: "Wednesday", dow: 3 },
  { day: "Jeudi", schemaDay: "Thursday", dow: 4 },
  { day: "Vendredi", schemaDay: "Friday", dow: 5 },
  { day: "Samedi", schemaDay: "Saturday", dow: 6 },
  { day: "Dimanche", schemaDay: "Sunday", dow: 0 },
];

export async function getOpeningDays(): Promise<OpeningDay[]> {
  try {
    const rules = (await (await getRepo()).listAvailability()).filter((r) => r.enabled);
    return DAYS.map(({ day, schemaDay, dow }) => ({
      day,
      schemaDay,
      slots: rules
        .filter((r) => r.dayOfWeek === dow)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((r) => `${r.startTime}-${r.endTime}`),
    }));
  } catch (error) {
    console.error("[horaires] Lecture impossible, horaires de site.ts utilisés :", error);
    return SITE.OPENING_HOURS;
  }
}

