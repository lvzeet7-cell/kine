/**
 * Envoi d'e-mails transactionnels.
 *
 * Option 1 — Gmail (configuration actuelle du cabinet) :
 *   EMAIL_PROVIDER=gmail
 *   GMAIL_USER              adresse Gmail qui envoie les e-mails
 *   GMAIL_APP_PASSWORD      « mot de passe d'application » Google (pas le mot de passe du compte)
 *   EMAIL_FROM_NAME         nom affiché comme expéditeur (facultatif)
 *
 * Option 2 — service d'envoi (si le cabinet a un jour son propre nom de domaine) :
 *   EMAIL_PROVIDER          resend | brevo | sendgrid
 *   EMAIL_PROVIDER_API_KEY  clé API du fournisseur
 *   EMAIL_FROM              ex. "Cabinet de kinésithérapie <rendez-vous@votre-domaine.fr>"
 *
 * Sans configuration : en développement, les e-mails sont affichés dans la console ;
 * en production, ils ne sont pas envoyés (le rendez-vous reste bien enregistré).
 */

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { sent: boolean; simulated?: boolean; error?: string };

const isGmail = () => (process.env.EMAIL_PROVIDER ?? "").toLowerCase() === "gmail";

export function emailConfigured(): boolean {
  if (isGmail()) return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  return !!(process.env.EMAIL_PROVIDER && process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM);
}

/** Envoi via le serveur SMTP de Gmail (nodemailer) */
async function sendWithGmail(email: Email) {
  const nodemailer = await import("nodemailer");
  const user = process.env.GMAIL_USER as string;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: (process.env.GMAIL_APP_PASSWORD as string).replace(/\s+/g, "") },
  });
  const name = (process.env.EMAIL_FROM_NAME ?? "").replace(/["<>]/g, "").trim();
  await transporter.sendMail({
    // Gmail impose l'adresse du compte comme expéditeur
    from: name ? { name, address: user } : user,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    ...(email.replyTo ? { replyTo: email.replyTo } : {}),
  });
}

function parseAddress(value: string): { email: string; name?: string } {
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  return m ? { name: m[1].replace(/^"|"$/g, "") || undefined, email: m[2] } : { email: value.trim() };
}

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
}

export async function sendEmail(email: Email): Promise<SendResult> {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email simulé] À : ${email.to}\nObjet : ${email.subject}\n\n${email.text}\n`);
      return { sent: false, simulated: true };
    }
    console.warn("[email] Fournisseur non configuré : e-mail non envoyé —", email.subject);
    return { sent: false, error: "not_configured" };
  }

  const provider = (process.env.EMAIL_PROVIDER ?? "").toLowerCase();
  const key = process.env.EMAIL_PROVIDER_API_KEY as string;
  const from = process.env.EMAIL_FROM as string;

  try {
    if (provider === "gmail") {
      await sendWithGmail(email);
    } else if (provider === "resend") {
      await post(
        "https://api.resend.com/emails",
        { Authorization: `Bearer ${key}` },
        { from, to: [email.to], subject: email.subject, html: email.html, text: email.text, reply_to: email.replyTo },
      );
    } else if (provider === "brevo") {
      const sender = parseAddress(from);
      await post(
        "https://api.brevo.com/v3/smtp/email",
        { "api-key": key },
        {
          sender,
          to: [{ email: email.to }],
          subject: email.subject,
          htmlContent: email.html,
          textContent: email.text,
          ...(email.replyTo ? { replyTo: { email: email.replyTo } } : {}),
        },
      );
    } else if (provider === "sendgrid") {
      await post(
        "https://api.sendgrid.com/v3/mail/send",
        { Authorization: `Bearer ${key}` },
        {
          personalizations: [{ to: [{ email: email.to }] }],
          from: parseAddress(from),
          subject: email.subject,
          content: [
            { type: "text/plain", value: email.text },
            { type: "text/html", value: email.html },
          ],
          ...(email.replyTo ? { reply_to: { email: email.replyTo } } : {}),
        },
      );
    } else {
      throw new Error(`Fournisseur inconnu : ${provider}`);
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] Échec de l'envoi :", error);
    return { sent: false, error: String(error) };
  }
}
