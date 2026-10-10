/** Validation des données de réservation — partagée navigateur / serveur */

export type PatientInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
};

export type PatientField = keyof PatientInput;
export type PatientErrors = Partial<Record<PatientField, string>>;

export const BOOKING_MESSAGE_MAX = 500;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s.()-]{10,20}$/;

const str = (v: unknown) => (typeof v === "string" ? v.trim().replace(/[\u0000-\u001F\u007F]/g, " ") : "");

export function normalizePatient(raw: Partial<Record<PatientField, unknown>>): PatientInput {
  return {
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    phone: str(raw.phone),
    email: str(raw.email).toLowerCase(),
    message: typeof raw.message === "string" ? raw.message.trim().slice(0, BOOKING_MESSAGE_MAX * 2) : "",
    consent: raw.consent === true,
  };
}

export function validatePatient(p: PatientInput, { requireConsent = true } = {}): PatientErrors {
  const e: PatientErrors = {};
  if (!p.firstName) e.firstName = "Indiquez votre prénom.";
  else if (p.firstName.length > 60) e.firstName = "Le prénom ne doit pas dépasser 60 caractères.";

  if (!p.lastName) e.lastName = "Indiquez votre nom.";
  else if (p.lastName.length > 60) e.lastName = "Le nom ne doit pas dépasser 60 caractères.";

  if (!p.phone) e.phone = "Indiquez votre numéro de téléphone.";
  else if (!PHONE_RE.test(p.phone) || p.phone.replace(/\D/g, "").length < 10 || p.phone.replace(/\D/g, "").length > 15)
    e.phone = "Vérifiez le numéro de téléphone, par exemple : 06 12 34 56 78";

  if (!p.email) e.email = "Indiquez votre adresse e-mail.";
  else if (!EMAIL_RE.test(p.email) || p.email.length > 120)
    e.email = "Vérifiez l'adresse e-mail, par exemple : prenom.nom@exemple.fr";

  if (p.message.length > BOOKING_MESSAGE_MAX)
    e.message = `Le message ne doit pas dépasser ${BOOKING_MESSAGE_MAX} caractères.`;

  if (requireConsent && !p.consent) e.consent = "Acceptez la politique de confidentialité pour continuer.";
  return e;
}
