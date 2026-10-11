/**
 * Authentification de l'espace admin.
 * - Mot de passe unique défini dans ADMIN_PASSWORD (12 caractères minimum)
 * - Session signée HMAC-SHA256 (SESSION_SECRET), cookie HttpOnly, SameSite=Strict,
 *   Secure en production, durée 8 h. Changer ADMIN_PASSWORD ou SESSION_SECRET déconnecte toutes les sessions.
 */

export const SESSION_COOKIE = "cabinet_admin";
const SESSION_HOURS = 8;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function adminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 12 && (process.env.SESSION_SECRET ?? "").length >= 32;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    // La clé dépend aussi du mot de passe : le changer déconnecte toutes les sessions ouvertes
    enc.encode(`${process.env.SESSION_SECRET ?? ""}\u0000${process.env.ADMIN_PASSWORD ?? ""}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Comparaison à durée constante */
function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function checkPassword(password: unknown): Promise<boolean> {
  if (!adminConfigured() || typeof password !== "string") return false;
  // Comparaison des empreintes pour ne pas révéler la longueur du mot de passe
  return safeEqual(await hmac("pw:" + password), await hmac("pw:" + process.env.ADMIN_PASSWORD));
}

export async function createSession(): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + SESSION_HOURS * 3_600_000 })));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(value: string | undefined | null): Promise<boolean> {
  if (!value || !adminConfigured()) return false;
  const [payload, sig] = value.split(".");
  if (!payload || !sig || !safeEqual(sig, await hmac(payload))) return false;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookie(value: string, maxAgeSeconds = SESSION_HOURS * 3600): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  return verifySession(readCookie(request, SESSION_COOKIE));
}
