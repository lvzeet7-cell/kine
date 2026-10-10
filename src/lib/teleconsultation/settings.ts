/**
 * Réglages de la téléconsultation (activation, durée, tarif), enregistrés en base
 * et modifiables depuis l'espace admin.
 */
import type { BookingRepository } from "@/lib/booking/repository";
import type { TeleSettings } from "@/lib/booking/types";

const KEY = "teleconsultation";

export const TELE_DEFAULTS: TeleSettings = { enabled: true, duration: 30, priceCents: null };

export const TELE_DURATIONS = [15, 20, 25, 30, 40, 45, 60];

export async function getTeleSettings(repo: BookingRepository): Promise<TeleSettings> {
  const raw = await repo.getSetting(KEY);
  if (!raw) return { ...TELE_DEFAULTS };
  try {
    const v = JSON.parse(raw) as Partial<TeleSettings>;
    return {
      enabled: typeof v.enabled === "boolean" ? v.enabled : TELE_DEFAULTS.enabled,
      duration: TELE_DURATIONS.includes(Number(v.duration)) ? Number(v.duration) : TELE_DEFAULTS.duration,
      priceCents: typeof v.priceCents === "number" && v.priceCents >= 0 ? Math.round(v.priceCents) : null,
    };
  } catch {
    return { ...TELE_DEFAULTS };
  }
}

export type SettingsErrors = Partial<Record<"duration" | "price", string>>;

/** Validation serveur des réglages envoyés depuis l'espace admin */
export async function saveTeleSettings(repo: BookingRepository, input: Record<string, unknown>) {
  const errors: SettingsErrors = {};
  const enabled = input.enabled === true;
  const duration = Number(input.duration);
  if (!TELE_DURATIONS.includes(duration)) errors.duration = `Choisissez une durée parmi : ${TELE_DURATIONS.join(", ")} minutes.`;

  let priceCents: number | null = null;
  const rawPrice = typeof input.price === "string" ? input.price.trim().replace(",", ".").replace(/\s*€$/, "") : input.price;
  if (rawPrice !== "" && rawPrice !== null && rawPrice !== undefined) {
    const n = Number(rawPrice);
    if (!Number.isFinite(n) || n < 0 || n > 1000) errors.price = "Indiquez un tarif en euros, par exemple 30 ou 32,50.";
    else priceCents = Math.round(n * 100);
  }
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  const settings: TeleSettings = { enabled, duration, priceCents };
  await repo.setSetting(KEY, JSON.stringify(settings));
  return { ok: true as const, settings };
}

/** « 30 € », « 32,50 € » ou null */
export function formatPrice(cents: number | null): string | null {
  if (cents === null) return null;
  const euros = cents / 100;
  return `${euros.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(euros) ? 0 : 2, maximumFractionDigits: 2 })} €`;
}
