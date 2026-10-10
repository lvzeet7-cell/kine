/**
 * Jetons de gestion des rendez-vous — Web Crypto (navigateur et Node.js).
 * Le jeton (256 bits aléatoires) n'est envoyé qu'au patient ;
 * seule son empreinte SHA-256 est enregistrée.
 */

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

export function randomId(): string {
  return crypto.randomUUID();
}

export async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Format attendu d'un jeton : 43 caractères base64url */
export function isTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
