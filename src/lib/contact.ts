/**
 * Validation du formulaire de contact — partagée entre le navigateur
 * et le serveur (route /api/contact) pour garantir les mêmes règles.
 */

export const CONTACT_REASONS = [
  "Prise de rendez-vous",
  "Modification ou annulation d'un rendez-vous",
  "Question administrative",
  "Question sur le déroulement des séances",
  "Autre demande",
] as const;

export type ContactPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  consent: boolean;
  /** Champ piège anti-robots (doit rester vide) */
  website: string;
  /** Horodatage d'affichage du formulaire (anti-robots) */
  startedAt: number;
};

export type ContactField = "firstName" | "lastName" | "email" | "phone" | "reason" | "message" | "consent";
export type ContactErrors = Partial<Record<ContactField, string>>;

export const MESSAGE_MAX = 1500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s.()-]{10,20}$/;

export function validateContact(data: Partial<ContactPayload>): ContactErrors {
  const errors: ContactErrors = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const firstName = str(data.firstName);
  const lastName = str(data.lastName);
  const email = str(data.email);
  const phone = str(data.phone);
  const reason = str(data.reason);
  const message = str(data.message);

  if (!firstName) errors.firstName = "Indiquez votre prénom.";
  else if (firstName.length > 60) errors.firstName = "Le prénom ne doit pas dépasser 60 caractères.";

  if (!lastName) errors.lastName = "Indiquez votre nom.";
  else if (lastName.length > 60) errors.lastName = "Le nom ne doit pas dépasser 60 caractères.";

  if (!email) errors.email = "Indiquez votre adresse e-mail.";
  else if (!EMAIL_RE.test(email) || email.length > 120)
    errors.email = "Vérifiez l'adresse e-mail, par exemple : prenom.nom@exemple.fr";

  if (phone && (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 10))
    errors.phone = "Vérifiez le numéro de téléphone, par exemple : 06 12 34 56 78";

  if (!reason || !(CONTACT_REASONS as readonly string[]).includes(reason)) errors.reason = "Choisissez le motif de votre demande.";

  if (!message) errors.message = "Écrivez votre message.";
  else if (message.length < 10) errors.message = "Votre message est trop court (10 caractères minimum).";
  else if (message.length > MESSAGE_MAX) errors.message = `Votre message ne doit pas dépasser ${MESSAGE_MAX} caractères.`;

  if (data.consent !== true) errors.consent = "Cochez la case pour autoriser le cabinet à vous répondre.";

  return errors;
}
