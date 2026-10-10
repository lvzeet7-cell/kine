/**
 * Modèles d'e-mails (HTML + texte).
 * Aucune donnée médicale : le message libre du patient n'est jamais recopié dans les e-mails.
 */
import { SITE, fullAddress, isAddressSet, isSet } from "@/data/site";
import { bookingConfig } from "@/lib/booking/config";
import { googleCalendarUrl } from "@/lib/booking/calendar";
import { formatLongDate, formatTime } from "@/lib/booking/time";
import type { Appointment } from "@/lib/booking/types";
import { siteName } from "@/lib/seo";
import type { Email } from "./send";
import { isTeleAppointment } from "@/lib/teleconsultation/kind";

const TZ = bookingConfig.timezone;

export function appUrl(): string {
  return (process.env.APP_URL || SITE.SITE_URL).replace(/\/$/, "");
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const cabinetName = () => (isSet(SITE.LOGO_TEXT) ? `${SITE.LOGO_TEXT} — Kinésithérapie` : siteName);

function when(a: Pick<Appointment, "startAt">) {
  const date = formatLongDate(a.startAt, TZ);
  return { date: date.charAt(0).toUpperCase() + date.slice(1), time: formatTime(a.startAt, TZ) };
}

function contactLines(): string[] {
  const lines: string[] = [];
  if (isAddressSet()) lines.push(fullAddress());
  if (isSet(SITE.PHONE)) lines.push(`Tél. ${SITE.PHONE}`);
  return lines;
}

/** Mise en page commune */
function layout(opts: { title: string; intro: string; rows: [string, string][]; body?: string; cta?: { label: string; url: string }; footer?: string }) {
  const rows = opts.rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;color:#546168;font-size:14px;width:120px;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;color:#1E2A2F;font-size:15px;font-weight:600">${esc(v)}</td></tr>`,
    )
    .join("");
  const cta = opts.cta
    ? `<p style="margin:28px 0 0"><a href="${esc(opts.cta.url)}" style="display:inline-block;background:#124B57;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:10px;font-size:15px">${esc(opts.cta.label)}</a></p>`
    : "";
  const contact = contactLines().map(esc).join("<br>");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(opts.title)}</title></head>
<body style="margin:0;background:#F7F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F4;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DCE2DF;border-radius:16px">
<tr><td style="padding:28px 32px 8px;border-bottom:1px solid #DCE2DF"><p style="margin:0 0 20px;color:#124B57;font-weight:700;font-size:15px">${esc(cabinetName())}</p></td></tr>
<tr><td style="padding:28px 32px 32px">
<h1 style="margin:0 0 12px;color:#1E2A2F;font-size:22px;line-height:1.3">${esc(opts.title)}</h1>
<p style="margin:0 0 20px;color:#3a474d;font-size:15px;line-height:1.6">${esc(opts.intro)}</p>
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #DCE2DF;border-bottom:1px solid #DCE2DF">${rows}</table>` : ""}
${opts.body ?? ""}${cta}
${opts.footer ? `<p style="margin:24px 0 0;color:#546168;font-size:13px;line-height:1.6">${esc(opts.footer)}</p>` : ""}
</td></tr>
${contact ? `<tr><td style="padding:20px 32px;border-top:1px solid #DCE2DF;color:#546168;font-size:13px;line-height:1.6">${contact}</td></tr>` : ""}
</table></td></tr></table></body></html>`;

  const text = [
    opts.title,
    "",
    opts.intro,
    "",
    ...opts.rows.map(([k, v]) => `${k} : ${v}`),
    ...(opts.cta ? ["", `${opts.cta.label} : ${opts.cta.url}`] : []),
    ...(opts.footer ? ["", opts.footer] : []),
    "",
    "—",
    cabinetName(),
    ...contactLines(),
  ].join("\n");
  return { html, text };
}

const manageUrl = (token: string) => `${appUrl()}/rendez-vous/gestion/${token}`;

function patientRows(a: Appointment): [string, string][] {
  const { date, time } = when(a);
  const rows: [string, string][] = [
    ["Motif", a.serviceName],
    ["Date", date],
    ["Heure", time],
    ["Durée", `${a.duration} minutes`],
  ];
  if (isTeleAppointment(a)) rows.push(["Lieu", "En ligne, par vidéo (téléconsultation)"]);
  else if (isAddressSet()) rows.push(["Adresse", fullAddress()]);
  return rows;
}

export const teleJoinUrl = (token: string) => `${appUrl()}/teleconsultation/${token}`;

const TELE_INSTRUCTIONS =
  "Le jour J, ouvrez le lien de la téléconsultation depuis un ordinateur, une tablette ou un smartphone récent (Chrome, Safari, Edge ou Firefox), dans un endroit calme et bien éclairé. La salle ouvre 15 minutes avant l'horaire : vous pourrez tester votre caméra et votre micro avant d'entrer. La consultation n'est pas enregistrée.";

function teleBody(token: string) {
  return `<p style="margin:20px 0 0;color:#3a474d;font-size:14px;line-height:1.6">${esc(TELE_INSTRUCTIONS)}</p>
<p style="margin:12px 0 0;font-size:14px">Pour modifier ou annuler : <a href="${esc(manageUrl(token))}" style="color:#124B57">gérer mon rendez-vous</a></p>`;
}

const INSTRUCTIONS =
  "Pensez à apporter votre ordonnance, votre carte Vitale et vos examens récents. Prévoyez une tenue confortable.";

export function patientConfirmation(a: Appointment, token: string): Email {
  const pending = a.status === "PENDING";
  const { date, time } = when(a);
  const calendar = googleCalendarUrl({
    uid: `${a.id}@cabinet`,
    title: `Kinésithérapie — ${a.serviceName}`,
    startAt: a.startAt,
    endAt: a.endAt,
    location: isAddressSet() ? fullAddress() : "",
    description: "",
  });
  const tele = isTeleAppointment(a);
  const { html, text } = layout({
    title: pending ? "Demande de rendez-vous enregistrée" : tele ? "Téléconsultation confirmée" : "Rendez-vous confirmé",
    intro: `Bonjour ${a.firstName}, ${pending ? "votre demande de rendez-vous a bien été enregistrée. Le cabinet vous confirmera le créneau." : tele ? "votre téléconsultation est bien enregistrée. Gardez cet e-mail : il contient votre lien personnel de connexion." : "votre rendez-vous est bien enregistré."}`,
    rows: patientRows(a),
    body: tele
      ? `${teleBody(token)}
<p style="margin:12px 0 0;font-size:14px"><a href="${esc(calendar)}" style="color:#124B57">Ajouter à Google Agenda</a></p>`
      : `<p style="margin:20px 0 0;color:#3a474d;font-size:14px;line-height:1.6">${esc(INSTRUCTIONS)}</p>
<p style="margin:12px 0 0;font-size:14px"><a href="${esc(calendar)}" style="color:#124B57">Ajouter à Google Agenda</a></p>`,
    cta: tele ? { label: "Accéder à la téléconsultation", url: teleJoinUrl(token) } : { label: "Gérer mon rendez-vous", url: manageUrl(token) },
    footer: `Vous pouvez modifier ou annuler ce rendez-vous en ligne jusqu'à ${bookingConfig.cancellationDeadlineHours} heures avant. Au-delà, merci d'appeler le cabinet. ${bookingConfig.cancellationPolicy}`,
  });
  return {
    to: a.email,
    subject: `${pending ? "Demande de rendez-vous" : "Rendez-vous confirmé"} — ${date} à ${time}`,
    html,
    text: tele
      ? `${text}\n\nGérer mon rendez-vous : ${manageUrl(token)}\nAjouter à Google Agenda : ${calendar}\n\n${TELE_INSTRUCTIONS}`
      : `${text}\n\nAjouter à Google Agenda : ${calendar}\n\n${INSTRUCTIONS}`,
  };
}

export function patientRescheduled(a: Appointment, token: string): Email {
  const { date, time } = when(a);
  const { html, text } = layout({
    title: "Rendez-vous modifié",
    intro: `Bonjour ${a.firstName}, votre rendez-vous a bien été déplacé. Voici le nouvel horaire.`,
    rows: patientRows(a),
    body: isTeleAppointment(a) ? teleBody(token) : undefined,
    cta: isTeleAppointment(a)
      ? { label: "Accéder à la téléconsultation", url: teleJoinUrl(token) }
      : { label: "Gérer mon rendez-vous", url: manageUrl(token) },
  });
  return { to: a.email, subject: `Rendez-vous modifié — ${date} à ${time}`, html, text };
}

/** Nouveau(x) lien(s) de gestion, demandés depuis le site (« Modifier ou annuler ») */
export function patientManageLinks(items: { appointment: Appointment; token: string }[]): Email {
  const first = items[0].appointment;
  const single = items.length === 1;
  const list = items
    .map(({ appointment: a, token }) => {
      const { date, time } = when(a);
      return { label: `${date} à ${time} — ${a.serviceName}`, url: isTeleAppointment(a) ? teleJoinUrl(token) : manageUrl(token) };
    });
  const body = single
    ? ""
    : `<ul style="margin:20px 0 0;padding:0;list-style:none">${list
        .map(
          (l) =>
            `<li style="margin:0 0 12px"><a href="${esc(l.url)}" style="color:#124B57;font-weight:600;font-size:15px">${esc(l.label)}</a></li>`,
        )
        .join("")}</ul>`;
  const { html, text } = layout({
    title: single ? "Gérer votre rendez-vous" : "Gérer vos rendez-vous",
    intro: `Bonjour ${first.firstName}, voici ${single ? "le lien pour modifier ou annuler votre rendez-vous" : "les liens pour modifier ou annuler vos rendez-vous"}. ${single ? "Il remplace" : "Ils remplacent"} ${single ? "celui" : "ceux"} reçu${single ? "" : "s"} précédemment.`,
    rows: single ? patientRows(first) : [],
    body,
    cta: single ? { label: "Modifier ou annuler", url: list[0].url } : undefined,
    footer: `Modification et annulation en ligne possibles jusqu'à ${bookingConfig.cancellationDeadlineHours} heures avant le rendez-vous. Au-delà, merci d'appeler le cabinet. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.`,
  });
  return {
    to: first.email,
    subject: single ? "Votre lien pour gérer votre rendez-vous" : "Vos liens pour gérer vos rendez-vous",
    html,
    text: single ? text : `${text}\n\n${list.map((l) => `${l.label} : ${l.url}`).join("\n")}`,
  };
}

export function patientCancelled(a: Appointment): Email {
  const { date, time } = when(a);
  const { html, text } = layout({
    title: "Rendez-vous annulé",
    intro: `Bonjour ${a.firstName}, votre rendez-vous a bien été annulé.`,
    rows: patientRows(a),
    cta: { label: "Prendre un nouveau rendez-vous", url: `${appUrl()}/rendez-vous` },
  });
  return { to: a.email, subject: `Rendez-vous annulé — ${date} à ${time}`, html, text };
}

export function patientReminder(a: Appointment): Email {
  const { date, time } = when(a);
  const { html, text } = layout({
    title: isTeleAppointment(a) ? "Rappel de votre téléconsultation" : "Rappel de votre rendez-vous",
    intro: isTeleAppointment(a)
      ? `Bonjour ${a.firstName}, nous vous rappelons votre téléconsultation. Connectez-vous avec le lien « Accéder à la téléconsultation » de votre e-mail de confirmation. Vous ne le retrouvez pas ? Redemandez-le depuis la page Rendez-vous du site, rubrique « Modifier ou annuler ».`
      : `Bonjour ${a.firstName}, nous vous rappelons votre rendez-vous au cabinet.`,
    rows: patientRows(a),
    footer: `${isTeleAppointment(a) ? TELE_INSTRUCTIONS : INSTRUCTIONS} En cas d'empêchement, prévenez le cabinet le plus tôt possible${isSet(SITE.PHONE) ? ` au ${SITE.PHONE}` : ""}.`,
  });
  return { to: a.email, subject: `Rappel — rendez-vous ${date} à ${time}`, html, text };
}

type CabinetEvent = "new" | "cancelled" | "moved";

export function cabinetNotification(a: Appointment, event: CabinetEvent, previousStartAt?: string): Email | null {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return null;
  const { date, time } = when(a);
  const titles: Record<CabinetEvent, string> = {
    new: "Nouveau rendez-vous",
    cancelled: "Rendez-vous annulé par le patient",
    moved: "Rendez-vous déplacé par le patient",
  };
  const rows: [string, string][] = [
    ["Patient", `${a.firstName} ${a.lastName}`],
    ["Téléphone", a.phone],
    ["E-mail", a.email],
    ["Motif", a.serviceName],
    ["Date", date],
    ["Heure", time],
  ];
  if (event === "moved" && previousStartAt) {
    const prev = when({ startAt: previousStartAt });
    rows.push(["Ancien horaire", `${prev.date} à ${prev.time}`]);
  }
  const { html, text } = layout({
    title: titles[event],
    intro: "Détails du rendez-vous :",
    rows,
    cta: { label: "Ouvrir l'agenda", url: `${appUrl()}/admin/agenda` },
  });
  return { to, subject: `${titles[event]} — ${a.firstName} ${a.lastName}, ${date} ${time}`, html, text, replyTo: a.email };
}
