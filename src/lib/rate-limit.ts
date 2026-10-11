/**
 * Limitation des tentatives partagée entre toutes les instances du serveur.
 *
 * Sur Vercel, chaque requête peut être traitée par une instance différente : un compteur en mémoire
 * ne suffit pas (un robot pourrait essayer des milliers de mots de passe). Les passages sont donc
 * enregistrés en base. L'adresse IP ou e-mail n'est jamais stockée en clair : seule une empreinte
 * (HMAC-SHA256 avec un secret du serveur) est conservée, et elle est purgée par la tâche planifiée.
 *
 * Si la base est momentanément injoignable, on se rabat sur le compteur en mémoire.
 */
import { getRepo } from "@/lib/booking/server";
import { rateLimited as memoryLimited } from "@/lib/http";

const enc = new TextEncoder();

async function fingerprint(value: string): Promise<string> {
  const secret = process.env.SESSION_SECRET || process.env.CRON_SECRET || "cabinet";
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Enregistre une tentative et indique si la limite est dépassée.
 * @param scope  type d'action (ex. "login")
 * @param id     identifiant à limiter (adresse IP, e-mail…) — jamais stocké en clair
 */
export async function tooManyAttempts(scope: string, id: string, max: number, windowMs: number): Promise<boolean> {
  const bucket = `${scope}:${await fingerprint(id.toLowerCase())}`;
  try {
    const now = Date.now();
    const count = await (await getRepo()).recordHit(bucket, now, now - windowMs);
    return count > max;
  } catch (error) {
    console.error("[limitation] Base indisponible, compteur en mémoire utilisé :", (error as Error).message);
    return memoryLimited(bucket, max, windowMs);
  }
}

/** Purge des passages de plus de 48 h (appelée par la tâche planifiée) */
export async function purgeAttempts(now = Date.now()) {
  return (await getRepo()).purgeHits(now - 48 * 3_600_000);
}
