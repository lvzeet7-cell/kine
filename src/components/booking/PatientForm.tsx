"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import { BOOKING_MESSAGE_MAX, type PatientErrors, type PatientField, type PatientInput } from "@/lib/booking/validation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

function Field({
  id,
  label,
  optional,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
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

/** Coordonnées du patient — aucune donnée médicale demandée */
export function PatientForm({
  values,
  errors,
  onChange,
}: {
  values: PatientInput & { website: string };
  errors: PatientErrors;
  onChange: (field: PatientField | "website", value: string | boolean) => void;
}) {
  const bind = (field: PatientField) => ({
    id: `bk-${field}`,
    name: field,
    value: values[field] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field, e.target.value),
    "aria-invalid": !!errors[field],
    "aria-describedby": errors[field] ? `bk-${field}-error` : field === "message" ? "bk-message-hint" : undefined,
    className: "field",
  });

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id="bk-firstName" label="Prénom" error={errors.firstName}>
        <input type="text" autoComplete="given-name" {...bind("firstName")} />
      </Field>
      <Field id="bk-lastName" label="Nom" error={errors.lastName}>
        <input type="text" autoComplete="family-name" {...bind("lastName")} />
      </Field>
      <Field id="bk-phone" label="Téléphone" error={errors.phone}>
        <input type="tel" inputMode="tel" autoComplete="tel" {...bind("phone")} />
      </Field>
      <Field id="bk-email" label="E-mail" error={errors.email} hint="La confirmation vous sera envoyée à cette adresse.">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          {...bind("email")}
          aria-describedby={errors.email ? "bk-email-error" : "bk-email-hint"}
        />
      </Field>
      <Field
        id="bk-message"
        label="Message pour le cabinet"
        optional
        error={errors.message}
        className="sm:col-span-2"
        hint={`Informations pratiques uniquement. N'indiquez pas d'informations médicales. ${values.message.length} / ${BOOKING_MESSAGE_MAX}`}
      >
        <textarea rows={3} maxLength={BOOKING_MESSAGE_MAX} {...bind("message")} className="field min-h-[6rem] resize-y" />
      </Field>

      {/* Champ piège anti-robots, invisible pour les personnes */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="bk-website">Ne pas remplir ce champ</label>
        <input
          id="bk-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => onChange("website", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <div className="flex items-start gap-3">
          <input
            id="bk-consent"
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => onChange("consent", e.target.checked)}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "bk-consent-error" : undefined}
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line accent-[rgb(var(--petrol))]",
              errors.consent && "outline outline-2 outline-offset-2 outline-danger",
            )}
          />
          <label htmlFor="bk-consent" className="cursor-pointer text-small text-ink/90">
            J&apos;accepte la{" "}
            <Link href="/confidentialite" className="link" target="_blank">
              politique de confidentialité
              <span className="sr-only"> (nouvel onglet)</span>
            </Link>
            .
          </label>
        </div>
        {errors.consent && (
          <p id="bk-consent-error" className="mt-2 flex items-start gap-1.5 pl-8 text-micro font-medium text-danger">
            <Icon name="alert" size={15} className="mt-px shrink-0" />
            {errors.consent}
          </p>
        )}
      </div>
    </div>
  );
}
