"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { formatLongDate, formatTime } from "@/lib/booking/time";
import { STATUS_LABELS, type PublicAppointment, type Slot } from "@/lib/booking/types";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SummaryList } from "./BookingSummary";
import { DateTimePicker } from "./DateTimePicker";
import { api } from "./hooks";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;

type Mode = "view" | "confirm-cancel" | "reschedule";

/** Page patient : consulter, déplacer ou annuler son rendez-vous */
export function ManageAppointment({
  token,
  initial,
  today,
  lastDate,
  phone,
  deadlineHours,
}: {
  token: string;
  initial: PublicAppointment;
  today: string;
  lastDate: string;
  phone: string | null;
  deadlineHours: number;
}) {
  const [appt, setAppt] = useState(initial);
  const [mode, setMode] = useState<Mode>("view");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const statusRef = useRef<HTMLDivElement>(null);

  const cancelled = appt.status === "CANCELLED";

  const post = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    setMessage(null);
    const r = await api<{ appointment: PublicAppointment }>(`/api/booking/manage/${token}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (r.ok) {
      setAppt(r.data.appointment);
      setMode("view");
      setMessage({ tone: "ok", text: success });
    } else {
      setMessage({ tone: "error", text: String(r.data.message) });
      if (r.status === 409) setRefreshKey((k) => k + 1);
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  return (
    <div className="space-y-8">
      <div ref={statusRef} tabIndex={-1} className="focus:outline-none" aria-live="polite">
        {message && (
          <div
            role={message.tone === "error" ? "alert" : "status"}
            className={
              message.tone === "error"
                ? "flex gap-3 rounded-card border border-danger/30 bg-danger/5 p-4 text-small"
                : "flex gap-3 rounded-card bg-sage-soft p-4 text-small"
            }
          >
            <Icon name={message.tone === "error" ? "alert" : "check"} size={20} className={message.tone === "error" ? "shrink-0 text-danger" : "shrink-0 text-success"} />
            <p>{message.text}</p>
          </div>
        )}
      </div>

      <SummaryList
        rows={[
          { label: "Statut", value: STATUS_LABELS[appt.status] },
          { label: "Motif", value: appt.serviceName },
          { label: "Date", value: <span className="first-letter:uppercase">{formatLongDate(appt.startAt, TZ)}</span> },
          { label: "Heure", value: formatTime(appt.startAt, TZ) },
          { label: "Durée", value: `${appt.duration} minutes` },
          { label: "Nom", value: `${appt.firstName} ${appt.lastName}` },
        ]}
      />

      {!cancelled && !appt.canManage && (
        <p className="rounded-card bg-mist/70 p-4 text-small text-ink">
          Ce rendez-vous ne peut plus être modifié en ligne (moins de {deadlineHours} heures avant, ou déjà passé).
          {phone ? ` Pour toute modification, appelez le cabinet au ${phone}.` : " Pour toute modification, contactez le cabinet."}
        </p>
      )}

      {!cancelled && appt.canManage && mode === "view" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" size="lg" onClick={() => setMode("reschedule")}>
            <Icon name="calendar" size={18} />
            Changer la date ou l&apos;heure
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setMode("confirm-cancel")}>
            Annuler le rendez-vous
          </Button>
        </div>
      )}

      {mode === "confirm-cancel" && (
        <div className="rounded-panel border border-danger/30 bg-danger/5 p-6">
          <h2 className="text-h3">Annuler ce rendez-vous ?</h2>
          <p className="mt-2 text-small text-muted">Le créneau sera libéré pour un autre patient. Cette action est définitive.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => post({ action: "cancel" }, "Votre rendez-vous a bien été annulé. Un e-mail de confirmation vous a été envoyé.")} disabled={busy} className="bg-danger hover:bg-danger/90">
              {busy ? "Annulation en cours…" : "Oui, annuler le rendez-vous"}
            </Button>
            <Button variant="secondary" onClick={() => setMode("view")} disabled={busy}>
              Non, garder le rendez-vous
            </Button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="rounded-panel border border-line bg-surface p-5 sm:p-8">
          <h2 className="text-h3">Choisissez un nouvel horaire</h2>
          <div className="mt-6">
            <DateTimePicker
              serviceId={appt.serviceId}
              today={today}
              lastDate={lastDate}
              date={date}
              slot={slot}
              onDateChange={setDate}
              onSlotChange={setSlot}
              refreshKey={refreshKey}
            />
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => setMode("view")} disabled={busy}>
              Annuler la modification
            </Button>
            <Button
              size="lg"
              disabled={!slot || busy}
              onClick={() =>
                slot &&
                post(
                  { action: "reschedule", startAt: slot.startAt },
                  `Votre rendez-vous a été déplacé au ${formatLongDate(slot.startAt, TZ)} à ${formatTime(slot.startAt, TZ)}.`,
                )
              }
            >
              {busy ? "Modification en cours…" : slot ? `Confirmer ${slot.time.replace(":", "h")}` : "Confirmer le nouvel horaire"}
            </Button>
          </div>
        </div>
      )}

      {cancelled && (
        <Link href="/rendez-vous" className={buttonClasses("primary", "lg")}>
          Prendre un nouveau rendez-vous
        </Link>
      )}

      {!cancelled && (
        <p className="text-small">
          <a href={`/api/booking/ics/${token}`} download="rendez-vous.ics" className="link">
            Ajouter à mon calendrier (.ics)
          </a>
        </p>
      )}
    </div>
  );
}
