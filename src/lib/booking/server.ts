/**
 * Accès aux données côté serveur (singleton).
 *
 * Deux modes de stockage :
 *  - Turso (si TURSO_DATABASE_URL est défini) : base hébergée, pour Vercel ou tout
 *    hébergement sans disque persistant ;
 *  - sinon, fichier SQLite local (DATABASE_PATH), pour un serveur classique.
 *
 * Les tables sont créées automatiquement au premier accès, et les horaires
 * initiaux sont repris de src/data/site.ts.
 */
import { SITE } from "@/data/site";
import type { BookingRepository } from "./repository";
import type { AvailabilityRule } from "./types";

const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/** Horaires de src/data/site.ts convertis en plages de réservation */
export function defaultAvailability(): Omit<AvailabilityRule, "id">[] {
  const rules: Omit<AvailabilityRule, "id">[] = [];
  for (const d of SITE.OPENING_HOURS) {
    for (const slot of d.slots) {
      const m = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(slot);
      if (m) rules.push({ dayOfWeek: DAY_INDEX[d.schemaDay], startTime: m[1], endTime: m[2], enabled: true });
    }
  }
  return rules;
}

const globalForRepo = globalThis as unknown as { __bookingRepo?: Promise<BookingRepository> };

async function openRepository() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    const token = process.env.TURSO_AUTH_TOKEN;
    if (!token) throw new Error("TURSO_AUTH_TOKEN manquant (voir .env.example).");
    const { TursoHttpExecutor } = await import("./libsql");
    const { LibsqlRepository } = await import("./libsql-repository");
    return LibsqlRepository.open(new TursoHttpExecutor(tursoUrl, token));
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Sur Vercel, configurez TURSO_DATABASE_URL et TURSO_AUTH_TOKEN : le disque n'y est pas conservé.",
    );
  }
  const { SqliteRepository } = await import("./sqlite-repository");
  return new SqliteRepository(process.env.DATABASE_PATH || "./data/cabinet.db");
}

export function getRepo(): Promise<BookingRepository> {
  if (!globalForRepo.__bookingRepo) {
    globalForRepo.__bookingRepo = (async () => {
      const repo = await openRepository();
      // Nouvelle base : horaires initiaux repris de src/data/site.ts
      if (repo.createdNow) await repo.replaceAvailability(defaultAvailability());
      return repo;
    })();
    // En cas d'échec (base injoignable), réessayer à la requête suivante
    globalForRepo.__bookingRepo.catch(() => {
      globalForRepo.__bookingRepo = undefined;
    });
  }
  return globalForRepo.__bookingRepo;
}
