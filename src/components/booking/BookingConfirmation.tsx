"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { SITE, fullAddress, hasPhone, isAddressSet } from "@/data/site";
import { googleCalendarUrl } from "@/lib/booking/calendar";
import { formatLongDate, formatTime } from "@/lib/booking/time";
import type { PublicAppointment } from "@/lib/booking/types";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;

/** Écran de confirmation après réservation */
export function BookingConfirmation({
  appointment,
  token,
  emailSent,
  email,
}: {
  appointment: PublicAppointment;
  token: string;
  emailSent: boolean;
  email: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  const pending = appointment.status === "PENDING";
  const tele = appointment.serviceId === "teleconsultation";
  const date = formatLongDate(appointment.startAt, TZ);
  const calendar = googleCalendarUrl({
    uid: token,
    title: `Kinésithérapie — ${appointment.serviceName}`,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    location: isAddressSet() ? fullAddress() : "",
    description: "",
  });

  return (
    <div className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-soft text-success">
        <Icon name="check" size={32} />
      </span>
      <h2 ref={heading} tabIndex={-1} className="mt-6 text-h2 focus:outline-none">
        {pending ? "Demande de rendez-vous enregistrée" : "Rendez-vous confirmé"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        {pending
          ? "Votre demande a bien été enregistrée. Le cabinet vous confirmera le créneau."
          : "Votre rendez-vous a bien été enregistré."}
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-panel border border-line bg-surface p-6 text-left sm:p-8">
        <p className="text-h3 first-letter:uppercase">{date}</p>
        <p className="mt-1 text-[1.5rem] font-semibold tabular-nums text-petrol">{formatTime(appointment.startAt, TZ)}</p>
        <p className="mt-4 text-small text-ink">
          {appointment.serviceName} · {appointment.duration} minutes
        </p>
        {tele ? (
          <p className="mt-1 flex items-start gap-2 text-small text-muted">
            <Icon name="video" size={16} className="mt-0.5 shrink-0" />
            En ligne, par vidéo. La salle ouvre 15 minutes avant l&apos;horaire.
          </p>
        ) : (
          isAddressSet() && (
            <p className="mt-1 flex items-start gap-2 text-small text-muted">
              <Icon name="pin" size={16} className="mt-0.5 shrink-0" />
              {fullAddress()}
            </p>
          )
        )}
        {tele && (
          <Link href={`/teleconsultation/${token}`} className={buttonClasses("primary", "md", "mt-6 w-full")}>
            <Icon name="video" size={18} />
            Accéder à la téléconsultation
          </Link>
        )}
      </div>

      <p className="mx-auto mt-6 max-w-md text-small text-muted" role="status">
        {emailSent ? (
          <>
            Un e-mail de confirmation vous a été envoyé à <strong className="text-ink">{email}</strong>.
          </>
        ) : (
          <>
            Notez bien ces informations : l&apos;e-mail de confirmation n&apos;a pas pu être envoyé.
            {tele && " Gardez ce lien précieusement : c'est lui qui vous permettra de rejoindre la téléconsultation."}
          </>
        )}
      </p>

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
        <p className="text-small font-semibold text-ink">Ajouter à mon calendrier</p>
        <div className="grid gap-3 xs:grid-cols-2">
          <a href={calendar} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "md")}>
            Google Agenda
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
          <a href={`/api/booking/ics/${token}`} download="rendez-vous.ics" className={buttonClasses("secondary", "md")}>
            Fichier .ics
          </a>
        </div>
        <Link href={`/rendez-vous/gestion/${token}`} className="link mt-3 text-small">
          Modifier ou annuler ce rendez-vous
        </Link>
      </div>

      <p className="mx-auto mt-8 max-w-md text-micro text-muted">
        Pensez à apporter votre ordonnance, votre carte Vitale et vos examens récents.
        {hasPhone() ? ` Une question ? Appelez le cabinet au ${SITE.PHONE}.` : ""}
      </p>
    </div>
  );
}
