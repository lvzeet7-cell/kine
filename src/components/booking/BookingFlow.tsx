"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BookingService } from "@/lib/booking/config";
import { formatLongDate } from "@/lib/booking/time";
import type { PublicAppointment, Slot } from "@/lib/booking/types";
import {
  normalizePatient,
  validatePatient,
  type PatientErrors,
  type PatientField,
  type PatientInput,
} from "@/lib/booking/validation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { BookingConfirmation } from "./BookingConfirmation";
import { BookingStepper } from "./BookingStepper";
import { SummaryList } from "./BookingSummary";
import { DateTimePicker } from "./DateTimePicker";
import { api } from "./hooks";
import { PatientForm } from "./PatientForm";
import { ServiceSelector } from "./ServiceSelector";
import { Turnstile } from "./Turnstile";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;

type Step = 0 | 1 | 2 | 3 | 4;

const emptyPatient: PatientInput & { website: string } = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  message: "",
  consent: false,
  website: "",
};

function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "flex gap-3 rounded-card border border-danger/30 bg-danger/5 p-4 text-small text-ink"
          : "flex gap-3 rounded-card bg-sage-soft p-4 text-small text-ink"
      }
    >
      <Icon name={tone === "error" ? "alert" : "info"} size={20} className={tone === "error" ? "mt-0.5 shrink-0 text-danger" : "mt-0.5 shrink-0 text-sage-deep"} />
      <div>{children}</div>
    </div>
  );
}

/** Parcours de réservation : consultation → date → coordonnées → confirmation */
export function BookingFlow({
  services,
  initialServiceId,
  today,
  lastDate,
  phone,
}: {
  services: BookingService[];
  initialServiceId: string | null;
  today: string;
  lastDate: string;
  phone: string | null;
}) {
  const preselected = services.find((s) => s.id === initialServiceId) ?? null;
  const [step, setStep] = useState<Step>(preselected ? 1 : 0);
  const [serviceId, setServiceId] = useState<string | null>(preselected?.id ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [patient, setPatient] = useState(emptyPatient);
  const [errors, setErrors] = useState<PatientErrors>({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [result, setResult] = useState<{ appointment: PublicAppointment; token: string; emailSent: boolean } | null>(null);
  const startedAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const service = services.find((s) => s.id === serviceId) ?? null;

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Changement d'étape : titre focalisé et haut du module visible
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    const top = (rootRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "instant" });
  }, [step]);

  const go = (s: Step) => {
    setNotice(null);
    setStep(s);
  };

  const updatePatient = (field: PatientField | "website", value: string | boolean) => {
    const next = { ...patient, [field]: value };
    setPatient(next);
    if (triedSubmit) setErrors(validatePatient(normalizePatient(next)));
  };

  const toSummary = () => {
    setTriedSubmit(true);
    const found = validatePatient(normalizePatient(patient));
    setErrors(found);
    const first = (Object.keys(found) as PatientField[])[0];
    if (first) {
      document.getElementById(`bk-${first}`)?.focus();
      return;
    }
    go(3);
  };

  const confirm = async () => {
    if (!service || !slot) return;
    setSubmitting(true);
    setNotice(null);
    const r = await api<{ appointment: PublicAppointment; token: string; emailSent: boolean }>("/api/booking", {
      method: "POST",
      body: JSON.stringify({
        serviceId: service.id,
        startAt: slot.startAt,
        ...patient,
        startedAt: startedAt.current,
        turnstileToken,
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      setResult(r.data);
      setStep(4);
      return;
    }
    if (r.status === 409) {
      // Créneau pris entre-temps : retour au choix de l'horaire, disponibilités actualisées
      setSlot(null);
      setRefreshKey((k) => k + 1);
      setStep(1);
      setNotice(String(r.data.message));
      return;
    }
    if (r.status === 422 && r.data.errors) {
      setErrors(r.data.errors as PatientErrors);
      setStep(2);
      setNotice(String(r.data.message));
      return;
    }
    setNotice(String(r.data.message));
  };

  if (step === 4 && result) {
    return (
      <div ref={rootRef} className="rounded-panel border border-line bg-paper px-5 py-10 sm:px-10 sm:py-14">
        <BookingConfirmation appointment={result.appointment} token={result.token} emailSent={result.emailSent} email={patient.email} />
      </div>
    );
  }

  const titles = ["Votre consultation", "Choisissez une date et un horaire", "Vos coordonnées", "Vérifiez votre rendez-vous"];

  return (
    <div ref={rootRef} className="rounded-panel border border-line bg-surface">
      <div className="border-b border-line px-5 py-5 sm:px-8">
        <BookingStepper current={Math.min(step, 3)} />
      </div>

      <div className="px-5 py-7 sm:px-8 sm:py-9">
        <h2 ref={headingRef} tabIndex={-1} className="text-[1.375rem] leading-tight focus:outline-none sm:text-[1.625rem]">
          {titles[step]}
        </h2>

        {notice && (
          <div className="mt-5">
            <Alert>{notice}</Alert>
          </div>
        )}

        {step === 0 && (
          <div className="mt-6">
            <ServiceSelector services={services} value={serviceId} onChange={setServiceId} />
            <div className="mt-8 flex justify-end">
              <Button size="lg" onClick={() => service && go(1)} disabled={!service} className="w-full sm:w-auto">
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 1 && service && (
          <div className="mt-6">
            <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted">
              <span>
                {service.name} · {service.duration} minutes
              </span>
              <button type="button" onClick={() => go(0)} className="link">
                Changer
              </button>
            </p>
            <DateTimePicker
              serviceId={service.id}
              today={today}
              lastDate={lastDate}
              date={date}
              slot={slot}
              onDateChange={setDate}
              onSlotChange={setSlot}
              refreshKey={refreshKey}
            />
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={() => go(0)} className="w-full sm:w-auto">
                <Icon name="chevronLeft" size={18} />
                Retour
              </Button>
              <Button size="lg" onClick={() => slot && go(2)} disabled={!slot} className="w-full sm:w-auto">
                {slot && date ? `Continuer · ${slot.time.replace(":", "h")}` : "Continuer"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form
            className="relative mt-6"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              toSummary();
            }}
          >
            <div className="mb-6">
              <Alert tone="info">
                Ne transmettez pas d&apos;informations médicales ici : elles seront abordées en séance.
              </Alert>
            </div>
            <PatientForm values={patient} errors={errors} onChange={updatePatient} />
            <Turnstile onToken={setTurnstileToken} />
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={() => go(1)} className="w-full sm:w-auto">
                <Icon name="chevronLeft" size={18} />
                Retour
              </Button>
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Vérifier mon rendez-vous
              </Button>
            </div>
          </form>
        )}

        {step === 3 && service && slot && (
          <div className="mt-6">
            <h3 className="mb-3 text-small font-semibold text-muted">Votre rendez-vous</h3>
            <SummaryList
              rows={[
                { label: "Motif", value: service.name },
                {
                  label: "Date",
                  value: <span className="first-letter:uppercase">{formatLongDate(slot.startAt, TZ)}</span>,
                  action: (
                    <button type="button" onClick={() => go(1)} className="link">
                      Modifier<span className="sr-only"> la date</span>
                    </button>
                  ),
                },
                { label: "Heure", value: slot.time.replace(":", "h") },
                { label: "Durée", value: `${service.duration} minutes` },
                ...(service.mode === "video" ? [{ label: "Lieu", value: "En ligne, par vidéo" }] : []),
                ...(service.mode === "video"
                  ? [{ label: "Tarif", value: service.price ?? "Communiqué par le cabinet" }]
                  : []),
                {
                  label: "Nom",
                  value: `${patient.firstName.trim()} ${patient.lastName.trim()}`,
                  action: (
                    <button type="button" onClick={() => go(2)} className="link">
                      Modifier<span className="sr-only"> les coordonnées</span>
                    </button>
                  ),
                },
                { label: "Téléphone", value: patient.phone.trim() },
                { label: "E-mail", value: patient.email.trim() },
              ]}
            />
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="secondary" onClick={() => go(2)} className="w-full sm:w-auto" disabled={submitting}>
                Modifier
              </Button>
              <Button size="lg" onClick={confirm} disabled={submitting} aria-disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Réservation en cours…
                  </>
                ) : (
                  "Confirmer le rendez-vous"
                )}
              </Button>
            </div>
            <p className="sr-only" aria-live="polite">
              {submitting ? "Réservation en cours." : ""}
            </p>
            {phone && (
              <p className="mt-6 text-micro text-muted">
                Un souci pour réserver ? Appelez le cabinet au {phone}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
