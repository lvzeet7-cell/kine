"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  CONTACT_REASONS,
  MESSAGE_MAX,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactPayload,
} from "@/lib/contact";
import { SITE, hasPhone, telHref } from "@/data/site";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Status = "idle" | "sending" | "success" | "error";

const initial = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  reason: "",
  message: "",
  consent: false,
  website: "",
};

const ORDER: ContactField[] = ["firstName", "lastName", "email", "phone", "reason", "message", "consent"];

function Field({
  id,
  label,
  optional,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-2 text-small font-semibold text-ink">
        {label}
        {optional && <span className="text-micro font-normal text-muted">Facultatif</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-micro text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-micro font-medium text-danger">
          <Icon name="alert" size={15} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const startedAt = useRef<number>(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const update = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const next = {
      ...values,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    };
    setValues(next);
    // Après une première tentative, la validation se met à jour en direct
    if (submitted) setErrors(validateContact(next));
  };

  const describedBy = (field: ContactField, hasHint = false) =>
    errors[field] ? `${field}-error` : hasHint ? `${field}-hint` : undefined;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    const found = validateContact(values);
    setErrors(found);

    const firstInvalid = ORDER.find((f) => found[f]);
    if (firstInvalid) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setStatus("sending");
    setServerMessage("");
    try {
      const payload: ContactPayload = { ...values, startedAt: startedAt.current };
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; errors?: ContactErrors };
      if (res.ok) {
        setStatus("success");
        setValues(initial);
        setSubmitted(false);
        return;
      }
      if (data.errors) setErrors(data.errors);
      setServerMessage(data.message ?? "Le message n'a pas pu être envoyé.");
      setStatus("error");
    } catch {
      setServerMessage("Le message n'a pas pu être envoyé : vérifiez votre connexion internet puis réessayez.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-panel border border-line bg-surface p-8 sm:p-10" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-success">
          <Icon name="check" size={24} />
        </span>
        <h2 ref={successRef} tabIndex={-1} className="mt-6 text-[1.5rem] leading-tight focus:outline-none">
          Message envoyé
        </h2>
        <p className="mt-3 text-muted">
          Merci, votre message a bien été transmis au cabinet. Une réponse vous sera apportée dès que possible.
        </p>
        <Button variant="secondary" className="mt-8" onClick={() => setStatus("idle")}>
          Écrire un autre message
        </Button>
      </div>
    );
  }

  const errorList = ORDER.filter((f) => errors[f]);
  const sending = status === "sending";

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-panel border border-line bg-surface p-6 sm:p-10" aria-labelledby="form-title">
      <h2 id="form-title" className="text-[1.5rem] leading-tight">
        Envoyer un message
      </h2>
      <p className="mt-2 text-small text-muted">Tous les champs sont obligatoires, sauf mention contraire.</p>

      <div className="mt-6 flex gap-3 rounded-card bg-sage-soft p-4 text-small text-ink/90">
        <Icon name="info" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
        <p>
          <strong className="font-semibold">Ne transmettez pas d&apos;informations médicales</strong> (diagnostic,
          traitement, résultats d&apos;examens) via ce formulaire. Elles seront abordées en séance, en toute
          confidentialité.
        </p>
      </div>

      {submitted && errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-card border border-danger/30 bg-danger/5 p-4 text-small focus:outline-none"
        >
          <p className="font-semibold text-danger">
            {errorList.length === 1 ? "1 champ est à corriger :" : `${errorList.length} champs sont à corriger :`}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
            {errorList.map((f) => (
              <li key={f}>
                <a href={`#${f}`} className="underline underline-offset-2 hover:text-danger">
                  {errors[f]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Field id="firstName" label="Prénom" error={errors.firstName}>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={values.firstName}
            onChange={update}
            aria-invalid={!!errors.firstName}
            aria-describedby={describedBy("firstName")}
            className="field"
          />
        </Field>
        <Field id="lastName" label="Nom" error={errors.lastName}>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={values.lastName}
            onChange={update}
            aria-invalid={!!errors.lastName}
            aria-describedby={describedBy("lastName")}
            className="field"
          />
        </Field>
        <Field id="email" label="E-mail" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={update}
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            className="field"
          />
        </Field>
        <Field id="phone" label="Téléphone" optional error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={update}
            aria-invalid={!!errors.phone}
            aria-describedby={describedBy("phone")}
            className="field"
          />
        </Field>

        <Field id="reason" label="Motif de votre demande" error={errors.reason} className="sm:col-span-2">
          <div className="relative">
            <select
              id="reason"
              name="reason"
              value={values.reason}
              onChange={update}
              aria-invalid={!!errors.reason}
              aria-describedby={describedBy("reason")}
              className="field appearance-none pr-12"
            >
              <option value="" disabled>
                Choisir un motif
              </option>
              {CONTACT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </Field>

        <Field
          id="message"
          label="Message"
          error={errors.message}
          className="sm:col-span-2"
          hint={`${values.message.length} / ${MESSAGE_MAX} caractères`}
        >
          <textarea
            id="message"
            name="message"
            rows={6}
            maxLength={MESSAGE_MAX}
            value={values.message}
            onChange={update}
            aria-invalid={!!errors.message}
            aria-describedby={describedBy("message", true)}
            className="field min-h-[9rem] resize-y"
          />
        </Field>

        {/* Piège anti-robots : invisible pour les personnes, rempli par les robots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Ne pas remplir ce champ</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={update} />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-start gap-3">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              checked={values.consent}
              onChange={update}
              aria-invalid={!!errors.consent}
              aria-describedby={describedBy("consent")}
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line accent-[rgb(var(--petrol))]",
                errors.consent && "outline outline-2 outline-offset-2 outline-danger",
              )}
            />
            <label htmlFor="consent" className="cursor-pointer text-small text-ink/90">
              J&apos;accepte que les informations saisies soient utilisées par le cabinet pour répondre à ma demande.
              Voir la{" "}
              <Link href="/confidentialite" className="link">
                politique de confidentialité
              </Link>
              .
            </label>
          </div>
          {errors.consent && (
            <p id="consent-error" className="mt-2 flex items-start gap-1.5 pl-8 text-micro font-medium text-danger">
              <Icon name="alert" size={15} className="mt-px shrink-0" />
              {errors.consent}
            </p>
          )}
        </div>
      </div>

      {status === "error" && serverMessage && (
        <div role="alert" className="mt-8 flex gap-3 rounded-card border border-danger/30 bg-danger/5 p-4 text-small text-ink">
          <Icon name="alert" size={20} className="mt-0.5 shrink-0 text-danger" />
          <p>
            {serverMessage}
            {hasPhone() && (
              <>
                {" "}
                Vous pouvez aussi appeler le cabinet au{" "}
                <a href={telHref(SITE.PHONE)} className="link">
                  {SITE.PHONE}
                </a>
                .
              </>
            )}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" disabled={sending} aria-disabled={sending} className="w-full sm:w-auto">
          {sending ? (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Envoi en cours…
            </>
          ) : (
            "Envoyer le message"
          )}
        </Button>
        <p className="text-micro text-muted" aria-live="polite">
          {sending ? "Envoi du message en cours." : ""}
        </p>
      </div>
    </form>
  );
}
