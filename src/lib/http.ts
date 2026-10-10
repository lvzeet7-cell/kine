/** Outils communs aux routes API (serveur) */

type Bucket = number[];
const buckets = new Map<string, Bucket>();

/**
 * Limitation du nombre de requêtes par adresse IP (mémoire du serveur).
 * Suffisant pour un cabinet sur un seul serveur ; pour plusieurs instances,
 * brancher un stockage partagé (Redis…).
 */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 10_000) buckets.clear();
  return recent.length > max;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Protection CSRF : les requêtes qui modifient des données doivent venir du site lui-même.
 * (Complète le cookie de session SameSite=Strict de l'espace admin.)
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const o = new URL(origin);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return !!host && o.host === host;
  } catch {
    return false;
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export const GENERIC_ERROR = "Une erreur est survenue. Veuillez réessayer dans quelques instants.";

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > 20_000) return null;
    const data = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/** Exécute un gestionnaire de route et masque les erreurs techniques au visiteur */
export async function safe(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error("[api]", error);
    return json({ message: GENERIC_ERROR }, 500);
  }
}

/** Vérification Cloudflare Turnstile (active seulement si TURNSTILE_SECRET_KEY est défini) */
export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
