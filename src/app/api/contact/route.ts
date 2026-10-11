import { validateContact, type ContactPayload } from "@/lib/contact";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { clientIp, json, readJson, safe, sameOrigin } from "@/lib/http";
import { tooManyAttempts } from "@/lib/rate-limit";

/**
 * Réception du formulaire de contact.
 * Protection anti-spam : champ piège, délai minimal de saisie,
 * limitation du nombre d'envois par adresse IP (en base), contrôle d'origine, validation serveur.
 *
 * Envoi à ADMIN_EMAIL via le fournisseur d'e-mails configuré (voir lib/email/send.ts).
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MIN_FILL_MS = 3000;

const clean = (v: unknown) => (typeof v === "string" ? v.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") : "");
/** Une seule ligne (pour l'objet de l'e-mail : aucun retour à la ligne possible) */
const oneLine = (v: string) => v.replace(/[\r\n\t]+/g, " ").trim();

export async function POST(request: Request) {
  return safe(() => handle(request));
}

async function handle(request: Request) {
  // Les envois doivent venir du site lui-même (protection CSRF)
  if (!sameOrigin(request)) return json({ message: "Requête refusée." }, 403);

  if (await tooManyAttempts("contact", clientIp(request), MAX_PER_WINDOW, WINDOW_MS)) {
    return json({ message: "Trop de messages ont été envoyés depuis votre connexion. Réessayez dans quelques minutes." }, 429);
  }

  const body = (await readJson(request)) as Partial<ContactPayload> | null;
  if (!body) return json({ message: "Requête invalide." }, 400);

  // Robots : on répond « succès » sans rien envoyer
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (clean(body.website) !== "" || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return json({ ok: true });
  }

  const errors = validateContact(body);
  if (Object.keys(errors).length > 0) {
    return json({ message: "Certains champs sont à corriger.", errors }, 422);
  }

  const data = {
    firstName: oneLine(clean(body.firstName)),
    lastName: oneLine(clean(body.lastName)),
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
      return json({ ok: true, simulated: true });
    }
    return json({ message: "L'envoi de messages n'est pas encore disponible sur le site." }, 503);
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
    return json({ message: "Le message n'a pas pu être envoyé. Réessayez dans un instant." }, 502);
  }

  return json({ ok: true });
}
