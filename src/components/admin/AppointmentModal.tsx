"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { BookingService } from "@/lib/booking/config";
import { formatLongDate, localDate, localTime } from "@/lib/booking/time";
import { APPOINTMENT_STATUSES, STATUS_LABELS, type AppointmentStatus } from "@/lib/booking/types";
import type { PatientErrors } from "@/lib/booking/validation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { adminApi, Notice, StatusBadge, type AdminAppointment } from "./shared";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;

type Form = {
  serviceId: string;
  date: string;
  time: string;
  duration: string;
  status: AppointmentStatus;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  notifyPatient: boolean;
};

function initialForm(services: BookingService[], a?: AdminAppointment | null, defaults?: { date?: string; time?: string }): Form {
  if (a) {
    return {
      serviceId: a.serviceId,
      date: localDate(a.startAt, TZ),
      time: localTime(a.startAt, TZ),
      duration: String(a.duration),
      status: a.status,
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      email: a.email,
      message: a.message,
      notifyPatient: true,
    };
  }
  const s = services[0];
  return {
    serviceId: s?.id ?? "",
    date: defaults?.date ?? localDate(new Date(), TZ),
    time: defaults?.time ?? "09:00",
    duration: String(s?.duration ?? 30),
    status: "CONFIRMED",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    message: "",
    notifyPatient: false,
  };
}

export type ModalState = { mode: "create"; defaults?: { date?: string; time?: string } } | { mode: "edit"; appointment: AdminAppointment } | null;

/** Fiche rendez-vous : création, modification, déplacement, statut, suppression */
export function AppointmentModal({
  state,
  services,
  onClose,
  onChanged,
}: {
  state: ModalState;
  services: BookingService[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = state?.mode === "edit" ? state.appointment : null;
  const [form, setForm] = useState<Form>(() => initialForm(services));
  const [errors, setErrors] = useState<PatientErrors>({});
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (state) {
      setForm(initialForm(services, state.mode === "edit" ? state.appointment : null, state.mode === "create" ? state.defaults : undefined));
      setErrors({});
      setMessage(null);
      setConfirmDelete(false);
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [state, services]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onService = (id: string) => {
    const s = services.find((x) => x.id === id);
    setForm((f) => ({ ...f, serviceId: id, duration: editing ? f.duration : String(s?.duration ?? f.duration) }));
  };

  const handle = async (promise: ReturnType<typeof adminApi<{ appointment?: AdminAppointment; emailSent?: boolean }>>, okText: string, close = true) => {
    setBusy(true);
    setMessage(null);
    const r = await promise;
    setBusy(false);
    if (r.ok) {
      onChanged();
      if (close) onClose();
      else setMessage({ tone: "ok", text: okText });
      return;
    }
    setErrors((r.data.errors as PatientErrors) ?? {});
    setMessage({ tone: "error", text: String(r.data.message) });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = {
      serviceId: form.serviceId,
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      status: form.status,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      message: form.message,
      notifyPatient: form.notifyPatient,
    };
    if (editing) {
      handle(adminApi(`/api/admin/appointments/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) }), "Rendez-vous enregistré.");
    } else {
      handle(adminApi("/api/admin/appointments", { method: "POST", body: JSON.stringify(body) }), "Rendez-vous créé.");
    }
  };

  const quickStatus = (status: AppointmentStatus) => {
    if (!editing) return;
    handle(
      adminApi(`/api/admin/appointments/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notifyPatient: status === "CANCELLED" && form.notifyPatient }),
      }),
      `Statut : ${STATUS_LABELS[status]}.`,
    );
  };

  const remove = () => {
    if (!editing) return;
    handle(adminApi(`/api/admin/appointments/${editing.id}`, { method: "DELETE" }), "Rendez-vous supprimé.");
  };

  const input = "field py-2.5";
  const err = (k: keyof PatientErrors) =>
    errors[k] ? (
      <p id={`am-${k}-error`} className="mt-1.5 text-micro font-medium text-danger">
        {errors[k]}
      </p>
    ) : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="am-title"
      className="m-auto max-h-[100dvh] w-full max-w-2xl overflow-y-auto rounded-none bg-surface p-0 text-ink shadow-lift sm:max-h-[calc(100dvh-2rem)] sm:rounded-panel"
    >
      <form onSubmit={submit} noValidate>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-7">
          <div>
            <h2 id="am-title" className="text-h3">
              {editing ? `${editing.firstName} ${editing.lastName}` : "Nouveau rendez-vous"}
            </h2>
            {editing && (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-micro text-muted">
                <StatusBadge status={editing.status} />
                <span className="first-letter:uppercase">
                  {formatLongDate(editing.startAt, TZ)} · {localTime(editing.startAt, TZ).replace(":", "h")}
                </span>
                <span>· {editing.source === "online" ? "Réservé en ligne" : "Créé par le cabinet"}</span>
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control hover:bg-mist">
            <Icon name="close" size={20} />
            <span className="sr-only">Fermer la fiche</span>
          </button>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          {message && <Notice tone={message.tone}>{message.text}</Notice>}

          {editing && (
            <div>
              <p className="mb-2 text-micro font-semibold text-muted">Actions rapides</p>
              <div className="flex flex-wrap gap-2">
                {editing.status !== "CONFIRMED" && (
                  <Button size="sm" variant="secondary" onClick={() => quickStatus("CONFIRMED")} disabled={busy}>
                    Confirmer
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => quickStatus("COMPLETED")} disabled={busy || editing.status === "COMPLETED"}>
                  Terminé
                </Button>
                <Button size="sm" variant="secondary" onClick={() => quickStatus("NO_SHOW")} disabled={busy || editing.status === "NO_SHOW"}>
                  Absent
                </Button>
                <Button size="sm" variant="secondary" onClick={() => quickStatus("CANCELLED")} disabled={busy || editing.status === "CANCELLED"} className="text-danger hover:text-danger">
                  Annuler le rendez-vous
                </Button>
              </div>
            </div>
          )}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-micro font-semibold text-muted">Rendez-vous</legend>
            <div className="sm:col-span-2">
              <label htmlFor="am-service" className="mb-1.5 block text-small font-semibold">
                Type de rendez-vous
              </label>
              <select id="am-service" value={form.serviceId} onChange={(e) => onService(e.target.value)} className={input}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {!s.enabled ? " (masqué en ligne)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="am-date" className="mb-1.5 block text-small font-semibold">
                Date
              </label>
              <input id="am-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="am-time" className="mb-1.5 block text-small font-semibold">
                  Heure
                </label>
                <input id="am-time" type="time" step={300} value={form.time} onChange={(e) => set("time", e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="am-duration" className="mb-1.5 block text-small font-semibold">
                  Durée (min)
                </label>
                <input id="am-duration" type="number" min={5} max={480} step={5} value={form.duration} onChange={(e) => set("duration", e.target.value)} className={input} />
              </div>
            </div>
            {!editing && (
              <div className="sm:col-span-2">
                <label htmlFor="am-status" className="mb-1.5 block text-small font-semibold">
                  Statut
                </label>
                <select id="am-status" value={form.status} onChange={(e) => set("status", e.target.value as AppointmentStatus)} className={input}>
                  {APPOINTMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-micro font-semibold text-muted">Patient</legend>
            <div>
              <label htmlFor="am-firstName" className="mb-1.5 block text-small font-semibold">Prénom</label>
              <input id="am-firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "am-firstName-error" : undefined} className={input} />
              {err("firstName")}
            </div>
            <div>
              <label htmlFor="am-lastName" className="mb-1.5 block text-small font-semibold">Nom</label>
              <input id="am-lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? "am-lastName-error" : undefined} className={input} />
              {err("lastName")}
            </div>
            <div>
              <label htmlFor="am-phone" className="mb-1.5 block text-small font-semibold">Téléphone</label>
              <input id="am-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "am-phone-error" : undefined} className={input} />
              {err("phone")}
            </div>
            <div>
              <label htmlFor="am-email" className="mb-1.5 block text-small font-semibold">E-mail</label>
              <input id="am-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "am-email-error" : undefined} className={input} />
              {err("email")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="am-message" className="mb-1.5 block text-small font-semibold">
                Message du patient <span className="font-normal text-muted">(facultatif)</span>
              </label>
              <textarea id="am-message" rows={2} value={form.message} onChange={(e) => set("message", e.target.value)} className={`${input} resize-y`} />
              {err("message")}
            </div>
          </fieldset>

          {editing && (
            <label className="flex items-start gap-3 text-small">
              <input type="checkbox" checked={form.notifyPatient} onChange={(e) => set("notifyPatient", e.target.checked)} className="mt-0.5 h-5 w-5 accent-[rgb(var(--petrol))]" />
              <span>Prévenir le patient par e-mail en cas de déplacement ou d&apos;annulation</span>
            </label>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          {editing ? (
            confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2 text-small">
                <span>Supprimer définitivement ?</span>
                <Button size="sm" onClick={remove} disabled={busy} className="bg-danger hover:bg-danger/90">
                  Supprimer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Non
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-left text-small font-medium text-danger hover:underline">
                Supprimer les données
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le rendez-vous"}
            </Button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
