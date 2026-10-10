"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatLocalDate, localDate } from "@/lib/booking/time";
import type { Closure, Unavailability } from "@/lib/booking/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { adminApi, AdminPageHeader, Notice } from "./shared";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <span className="flex items-center gap-2 text-small">
      <Button size="sm" onClick={onConfirm} className="bg-danger hover:bg-danger/90">Supprimer</Button>
      <Button size="sm" variant="ghost" onClick={() => setAsk(false)}>Non</Button>
    </span>
  ) : (
    <button type="button" onClick={() => setAsk(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-mist hover:text-danger">
      <Icon name="close" size={18} />
      <span className="sr-only">Supprimer {label}</span>
    </button>
  );
}

/** Congés et fermetures exceptionnelles (journées entières) */
export function ClosureManager() {
  const today = localDate(new Date(), TZ);
  const [items, setItems] = useState<Closure[] | null>(null);
  const [form, setForm] = useState({ startDate: today, endDate: today, reason: "" });
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await adminApi<{ closures: Closure[] }>("/api/admin/closures");
    if (r.ok) setItems(r.data.closures);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const r = await adminApi("/api/admin/closures", { method: "POST", body: JSON.stringify(form) });
    if (r.ok) {
      setMessage({ tone: "ok", text: "Fermeture ajoutée : aucun créneau ne sera proposé sur cette période." });
      setForm({ startDate: today, endDate: today, reason: "" });
      load();
    } else setMessage({ tone: "error", text: String(r.data.message) });
  };

  const remove = async (id: string) => {
    await adminApi(`/api/admin/closures/${id}`, { method: "DELETE" });
    load();
  };

  const input = "field py-2.5";

  return (
    <div>
      <AdminPageHeader title="Congés et fermetures" description="Pendant ces périodes, aucun rendez-vous ne peut être réservé en ligne." />
      <form onSubmit={add} noValidate className="mt-6 grid gap-3 rounded-card border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
        <div>
          <label htmlFor="c-start" className="mb-1.5 block text-micro font-semibold text-muted">Du</label>
          <input id="c-start" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? e.target.value : f.endDate }))} className={input} />
        </div>
        <div>
          <label htmlFor="c-end" className="mb-1.5 block text-micro font-semibold text-muted">Au (inclus)</label>
          <input id="c-end" type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className={input} />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="c-reason" className="mb-1.5 block text-micro font-semibold text-muted">Motif (interne, facultatif)</label>
          <input id="c-reason" type="text" maxLength={120} placeholder="Ex. congés d'été" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className={input} />
        </div>
        <Button type="submit">Ajouter</Button>
      </form>
      {message && <div className="mt-4"><Notice tone={message.tone}>{message.text}</Notice></div>}

      <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
        {!items ? (
          <li className="px-5 py-8 text-small text-muted">Chargement…</li>
        ) : items.length === 0 ? (
          <li className="px-5 py-8 text-small text-muted">Aucune fermeture programmée.</li>
        ) : (
          items.map((c) => {
            const past = c.endDate < today;
            return (
              <li key={c.id} className={cn("flex items-center justify-between gap-4 px-5 py-4", past && "opacity-60")}>
                <div>
                  <p className="font-medium">
                    {c.startDate === c.endDate ? cap(formatLocalDate(c.startDate)) : `Du ${formatLocalDate(c.startDate)} au ${formatLocalDate(c.endDate)}`}
                  </p>
                  <p className="text-micro text-muted">{c.reason || "Sans motif"}{past ? " · passé" : ""}</p>
                </div>
                <DeleteButton label="cette fermeture" onConfirm={() => remove(c.id)} />
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

/** Indisponibilités ponctuelles (quelques heures) — motif jamais visible par les patients */
export function UnavailabilityManager() {
  const today = localDate(new Date(), TZ);
  const [items, setItems] = useState<Unavailability[] | null>(null);
  const [form, setForm] = useState({ date: today, startTime: "14:00", endTime: "16:00", reason: "" });
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await adminApi<{ unavailabilities: Unavailability[] }>(`/api/admin/unavailabilities?from=${today}`);
    if (r.ok) setItems(r.data.unavailabilities);
  }, [today]);
  useEffect(() => {
    load();
  }, [load]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const r = await adminApi("/api/admin/unavailabilities", { method: "POST", body: JSON.stringify(form) });
    if (r.ok) {
      setMessage({ tone: "ok", text: "Indisponibilité ajoutée : ces horaires ne sont plus proposés." });
      setForm((f) => ({ ...f, reason: "" }));
      load();
    } else setMessage({ tone: "error", text: String(r.data.message) });
  };

  const remove = async (id: string) => {
    await adminApi(`/api/admin/unavailabilities/${id}`, { method: "DELETE" });
    load();
  };

  const input = "field py-2.5";

  return (
    <div>
      <AdminPageHeader title="Indisponibilités" description="Bloquez quelques heures (formation, rendez-vous personnel…). Le motif reste interne." />
      <form onSubmit={add} noValidate className="mt-6 grid gap-3 rounded-card border border-line bg-surface p-5 sm:grid-cols-3 lg:grid-cols-[1fr_0.7fr_0.7fr_1.5fr_auto] lg:items-end">
        <div>
          <label htmlFor="u-date" className="mb-1.5 block text-micro font-semibold text-muted">Date</label>
          <input id="u-date" type="date" min={today} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={input} />
        </div>
        <div>
          <label htmlFor="u-start" className="mb-1.5 block text-micro font-semibold text-muted">De</label>
          <input id="u-start" type="time" step={300} value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className={input} />
        </div>
        <div>
          <label htmlFor="u-end" className="mb-1.5 block text-micro font-semibold text-muted">À</label>
          <input id="u-end" type="time" step={300} value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className={input} />
        </div>
        <div className="sm:col-span-3 lg:col-span-1">
          <label htmlFor="u-reason" className="mb-1.5 block text-micro font-semibold text-muted">Motif interne (facultatif)</label>
          <input id="u-reason" type="text" maxLength={120} placeholder="Ex. formation" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className={input} />
        </div>
        <Button type="submit">Ajouter</Button>
      </form>
      {message && <div className="mt-4"><Notice tone={message.tone}>{message.text}</Notice></div>}

      <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
        {!items ? (
          <li className="px-5 py-8 text-small text-muted">Chargement…</li>
        ) : items.length === 0 ? (
          <li className="px-5 py-8 text-small text-muted">Aucune indisponibilité à venir.</li>
        ) : (
          items.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-medium">
                  {cap(formatLocalDate(u.date))} · <span className="tabular-nums">{u.startTime.replace(":", "h")} – {u.endTime.replace(":", "h")}</span>
                </p>
                <p className="text-micro text-muted">{u.reason || "Sans motif"}</p>
              </div>
              <DeleteButton label="cette indisponibilité" onConfirm={() => remove(u.id)} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
