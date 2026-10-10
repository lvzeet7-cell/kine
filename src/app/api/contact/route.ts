import { NextResponse } from "next/server";
import { validateContact, type ContactPayload } from "@/lib/contact";
import { emailConfigured, sendEmail } from "@/lib/email/send";

/**
 * Réception du formulaire de contact.
 * Protection anti-spam : champ piège, délai minimal de saisie,
 * limitation du nombre d'envois par adresse IP, validation serveur.
 *
 * Envoi à ADMIN_EMAIL via le fournisseur d'e-mails configuré (voir lib/email/send.ts).
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MIN_FILL_MS = 3000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const clean = (v: unknown) => (typeof v === "string" ? v.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") : "");

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { message: "Trop de messages ont été envoyés depuis votre connexion. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  let body: Partial<ContactPayload>;
  try {
    body = (await request.json()) as Partial<ContactPayload>;
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }

  // Robots : on répond « succès » sans rien envoyer
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (clean(body.website) !== "" || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  const errors = validateContact(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: "Certains champs sont à corriger.", errors }, { status: 422 });
  }

  const data = {
    firstName: clean(body.firstName),
    lastName: clean(body.lastName),
    email: clean(body.email),
    phone: clean(body.phone),
    reason: clean(body.reason),
    message: clean(body.message),
  };

  const text = [
    `Nouveau message depuis le site internet`,
    ``,
    `Nom : ${data.firstName} ${data.lastName}`,
    `E-mail : ${data.email}`,
    `Téléphone : ${data.phone || "non renseigné"}`,
    `Motif : ${data.reason}`,
    ``,
    `Message :`,
    data.message,
  ].join("\n");

  const to = process.env.ADMIN_EMAIL;
  if (!to || !emailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[contact] Envoi simulé (e-mail non configuré) :\n" + text);
      return NextResponse.json({ ok: true, simulated: true });
    }
    return NextResponse.json(
      { message: "L'envoi de messages n'est pas encore disponible sur le site." },
      { status: 503 },
    );
  }

  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const result = await sendEmail({
    to,
    replyTo: data.email,
    subject: `Site internet — ${data.reason} — ${data.firstName} ${data.lastName}`.slice(0, 180),
    text,
    html: `<pre style="font-family:inherit;white-space:pre-wrap">${esc(text)}</pre>`,
  });
  if (!result.sent) {
    return NextResponse.json({ message: "Le message n'a pas pu être envoyé. Réessayez dans un instant." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
