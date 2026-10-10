"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { BookingService } from "@/lib/booking/config";
import { bookingConfig } from "@/lib/booking/config";
import { formatLongDate, localTime } from "@/lib/booking/time";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AppointmentModal, type ModalState } from "./AppointmentModal";
import { adminApi, AdminPageHeader, Notice, StatusBadge, type AdminAppointment } from "./shared";

const TZ = bookingConfig.timezone;

type Item = {
  appointment: AdminAppointment;
  price: string | null;
  roomReady: boolean;
  patientJoinedAt: string | null;
  practitionerJoinedAt: string | null;
  issueReport: string | null;
  issueAt: string | null;
};

type Settings = { enabled: boolean; duration: number; priceCents: number | null };
type SettingsResponse = { settings: Settings; providerConfigured: boolean; emailConfigured: boolean; durations: number[] };

const VIEWS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "upcoming", label: "À venir" },
  { id: "done", label: "Passées" },
  { id: "cancelled", label: "Annulées" },
  { id: "all", label: "Toutes" },
] as const;
type View = (typeof VIEWS)[number]["id"];

const dateTime = (iso: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

function SettingsPanel() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi<SettingsResponse>("/api/admin/teleconsultations/settings").then((r) => {
      if (!r.ok) return;
      setData(r.data);
      setEnabled(r.data.settings.enabled);
      setDuration(r.data.settings.duration);
      setPrice(r.data.settings.priceCents === null ? "" : String(r.data.settings.priceCents / 100).replace(".", ","));
    });
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErrors({});
    const r = await adminApi<{ settings?: Settings; errors?: Record<string, string>; message?: string }>("/api/admin/teleconsultations/settings", {
      method: "PUT",
      body: JSON.stringify({ enabled, duration, price }),
    });
    setSaving(false);
    if (r.ok) setMsg({ tone: "ok", text: "Réglages enregistrés." });
    else {
      setErrors(r.data.errors ?? {});
      setMsg({ tone: "error", text: String(r.data.message ?? "Les réglages n'ont pas été enregistrés.") });
    }
  }

  return (
    <section aria-labelledby="tele-settings" className="rounded-card border border-line bg-surface p-5">
      <h2 id="tele-settings" className="font-semibold">
        Réglages
      </h2>
      {data && (
        <ul className="mt-3 space-y-1.5 text-small">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", data.providerConfigured ? "bg-success" : "bg-warning")} />
            Visioconférence : {data.providerConfigured ? "fournisseur configuré (Daily)" : "non configurée (DAILY_API_KEY manquante)"}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", data.emailConfigured ? "bg-success" : "bg-warning")} />
            E-mails : {data.emailConfigured ? "configurés" : "non configurés — aucun lien n'est envoyé"}
          </li>
        </ul>
      )}
      <form onSubmit={save} className="mt-4 space-y-4">
        <label className="flex items-center gap-3 text-small">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4" />
          Proposer la téléconsultation à la réservation en ligne
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tele-duration" className="text-small font-medium">
              Durée
            </label>
            <select id="tele-duration" className="field mt-1.5 py-2.5" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {(data?.durations ?? [15, 20, 25, 30, 40, 45, 60]).map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
            {errors.duration && <p className="mt-1 text-micro text-danger">{errors.duration}</p>}
          </div>
          <div>
            <label htmlFor="tele-price" className="text-small font-medium">
              Tarif (€)
            </label>
            <input
              id="tele-price"
              inputMode="decimal"
              className="field mt-1.5 py-2.5"
              placeholder="Non communiqué"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-describedby="tele-price-help"
            />
            <p id="tele-price-help" className="mt-1 text-micro text-muted">
              Laisser vide : « Communiqué par le cabinet ». Le tarif est figé sur chaque rendez-vous au moment de la réservation.
            </p>
            {errors.price && <p className="mt-1 text-micro text-danger">{errors.price}</p>}
          </div>
        </div>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Button type="submit" disabled={saving || !data}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </section>
  );
}

/** Espace admin : liste et suivi des téléconsultations */
export function TeleconsultationsAdmin({ services }: { services: BookingService[] }) {
  const [view, setView] = useState<View>("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ view });
    if (view !== "today") {
      if (from) p.set("from", from);
      if (to) p.set("to", to);
    }
    const r = await adminApi<{ items: Item[] }>(`/api/admin/teleconsultations?${p}`);
    if (r.ok) {
      setItems(r.data.items);
      setError(null);
    } else setError(String(r.data.message));
  }, [view, from, to]);

  useEffect(() => {
    setItems(null);
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [load]);

  async function markCompleted(a: AdminAppointment) {
    setBusy(a.id);
    setFlash(null);
    const r = await adminApi(`/api/admin/appointments/${a.id}`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) });
    setBusy(null);
    setFlash(r.ok ? { tone: "ok", text: `Téléconsultation de ${a.firstName} ${a.lastName} marquée comme terminée.` } : { tone: "error", text: String((r.data as { message?: string }).message ?? "Échec.") });
    load();
  }

  async function sendLink(a: AdminAppointment) {
    setBusy(a.id);
    setFlash(null);
    const r = await adminApi<{ message?: string }>(`/api/admin/teleconsultations/${a.id}/send-link`, { method: "POST", body: "{}" });
    setBusy(null);
    setFlash({ tone: r.ok ? "ok" : "error", text: String(r.data.message ?? (r.ok ? "Lien envoyé." : "Échec de l'envoi.")) });
  }

  return (
    <div>
      <AdminPageHeader
        title="Téléconsultations"
        description={items ? `${items.length} téléconsultation${items.length > 1 ? "s" : ""}` : "Chargement…"}
        actions={<Button onClick={() => setModal({ mode: "create" })}>Nouveau rendez-vous</Button>}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div role="tablist" aria-label="Période" className="flex flex-wrap gap-1 rounded-control bg-mist p-1">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={view === v.id}
                  onClick={() => setView(v.id)}
                  className={cn("rounded-[0.5rem] px-3 py-1.5 text-small font-medium", view === v.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {view !== "today" && (
              <div className="flex flex-wrap gap-2">
                <label className="text-micro text-muted">
                  Du
                  <input type="date" className="field mt-1 block py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
                </label>
                <label className="text-micro text-muted">
                  Au
                  <input type="date" className="field mt-1 block py-2" value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
              </div>
            )}
          </div>

          {error && <Notice tone="error">{error}</Notice>}
          {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

          {!items ? (
            <p className="rounded-card border border-line bg-surface px-5 py-6 text-small text-muted">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="rounded-card border border-line bg-surface px-5 py-6 text-small text-muted">Aucune téléconsultation pour cette période.</p>
          ) : (
            <ul className="space-y-3" aria-label="Téléconsultations">
              {items.map((it) => {
                const a = it.appointment;
                const active = a.status === "PENDING" || a.status === "CONFIRMED";
                return (
                  <li key={a.id} className="rounded-card border border-line bg-surface p-4 sm:p-5" data-tele-row={a.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {a.firstName} {a.lastName}
                        </p>
                        <p className="text-small text-muted">
                          <span className="first-letter:uppercase">{formatLongDate(a.startAt, TZ)}</span> · {localTime(a.startAt, TZ).replace(":", "h")} · {a.duration} min ·{" "}
                          {it.price ?? "tarif non communiqué"}
                        </p>
                        <p className="mt-1 break-all text-micro text-muted">
                          <a className="link" href={`mailto:${a.email}`}>
                            {a.email}
                          </a>{" "}
                          · <a className="link" href={`tel:${a.phone.replace(/\s/g, "")}`}>{a.phone}</a>
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-micro text-muted">
                      <span>Salle : {it.roomReady ? "prête" : active ? "créée à l'ouverture" : "fermée"}</span>
                      <span>Patient connecté : {it.patientJoinedAt ? dateTime(it.patientJoinedAt) : "—"}</span>
                      <span>Vous : {it.practitionerJoinedAt ? dateTime(it.practitionerJoinedAt) : "—"}</span>
                    </div>
                    {it.issueReport && (
                      <p className="mt-3 flex gap-2 rounded-card bg-warning-soft p-3 text-small">
                        <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warning" />
                        <span>
                          <strong className="font-semibold">Problème signalé</strong>
                          {it.issueAt ? ` (${dateTime(it.issueAt)})` : ""} : {it.issueReport}
                        </span>
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {active && (
                        <Link href={`/admin/teleconsultations/${a.id}`} className="inline-flex h-10 items-center gap-2 rounded-control bg-petrol px-4 text-[0.9375rem] font-semibold text-white hover:bg-petrol-deep">
                          <Icon name="video" size={16} />
                          Ouvrir la salle
                        </Link>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => setModal({ mode: "edit", appointment: a })}>
                        Détails / modifier / annuler
                      </Button>
                      {active && (
                        <Button size="sm" variant="secondary" disabled={busy === a.id} onClick={() => markCompleted(a)}>
                          Marquer comme terminée
                        </Button>
                      )}
                      {active && (
                        <Button size="sm" variant="ghost" disabled={busy === a.id} onClick={() => sendLink(a)}>
                          Renvoyer le lien au patient
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <SettingsPanel />
          <p className="text-micro text-muted">
            Aucun enregistrement audio ou vidéo n&apos;est réalisé. Les salles sont privées, accessibles uniquement avec un jeton temporaire, et sont supprimées à l&apos;annulation,
            au report ou à la fin de la séance.
          </p>
        </div>
      </div>

      <AppointmentModal state={modal} services={services} onClose={() => setModal(null)} onChanged={load} />
    </div>
  );
}
