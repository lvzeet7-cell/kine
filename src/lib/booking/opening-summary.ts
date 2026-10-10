import type { OpeningDay } from "@/data/site";

/**
 * Résumé en une ligne, ex. « Du mardi au vendredi, 8h30 – 19h30 ».
 * Renvoie null si les jours ouverts n'ont pas tous les mêmes horaires ou ne se suivent pas.
 */
export function openingSummary(days: OpeningDay[]): string | null {
  const open = days.map((d, i) => ({ ...d, i })).filter((d) => d.slots.length > 0);
  if (open.length === 0) return null;
  const same = open.every((d) => d.slots.join("|") === open[0].slots.join("|"));
  const contiguous = open.every((d, k) => k === 0 || d.i === open[k - 1].i + 1);
  if (!same || !contiguous || open[0].slots.length !== 1) return null;
  const [start, end] = open[0].slots[0].split("-").map((t) => t.replace(":", "h").replace(/^0/, ""));
  const first = open[0].day.toLowerCase();
  const last = open[open.length - 1].day.toLowerCase();
  const range = open.length === 1 ? `Le ${first}` : `Du ${first} au ${last}`;
  return `${range}, ${start} – ${end}`;
}
