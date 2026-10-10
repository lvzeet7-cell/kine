"use client";

import { useCallback, useEffect, useState } from "react";
import type { BookingService } from "@/lib/booking/config";
import { formatLongDate, localDate, localTime } from "@/lib/booking/time";
import { APPOINTMENT_STATUSES, STATUS_LABELS } from "@/lib/booking/types";
import { Button } from "@/components/ui/Button";
import { AppointmentModal, type ModalState } from "./AppointmentModal";
import { adminApi, AdminPageHeader, Notice, StatusBadge, type AdminAppointment } from "./shared";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;

/** Liste des rendez-vous : recherche et filtres */
export function AppointmentList({ services }: { services: BookingService[] }) {
  const today = localDate(new Date(), TZ);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState("");
  const [items, setItems] = useState<AdminAppointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "300" });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (service) params.set("service", service);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const r = await adminApi<{ appointments: AdminAppointment[] }>(`/api/admin/appointments?${params}`);
    if (r.ok) {
      setItems(r.data.appointments);
      setError(null);
    } else setError(String(r.data.message));
  }, [q, status, service, from, to]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const reset = () => {
    setQ("");
    setStatus("");
    setService("");
    setFrom(today);
    setTo("");
  };

  const input = "field py-2.5";

  return (
    <div>
      <AdminPageHeader
        title="Rendez-vous"
        description={items ? `${items.length} résultat${items.length > 1 ? "s" : ""}` : "Chargement…"}
        actions={<Button onClick={() => setModal({ mode: "create" })}>Nouveau rendez-vous</Button>}
      />

      <form className="mt-6 grid gap-3 rounded-card border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] lg:items-end" onSubmit={(e) => e.preventDefault()} role="search">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="f-q" className="mb-1.5 block text-micro font-semibold text-muted">Rechercher</label>
          <input id="f-q" type="search" placeholder="Nom, e-mail ou téléphone" value={q} onChange={(e) => setQ(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="f-status" className="mb-1.5 block text-micro font-semibold text-muted">Statut</label>
          <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
            <option value="">Tous</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-service" className="mb-1.5 block text-micro font-semibold text-muted">Type</label>
          <select id="f-service" value={service} onChange={(e) => setService(e.target.value)} className={input}>
            <option value="">Tous</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className="mb-1.5 block text-micro font-semibold text-muted">Du</label>
          <input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="f-to" className="mb-1.5 block text-micro font-semibold text-muted">Au</label>
          <input id="f-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="justify-self-start">
          Réinitialiser
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-card border border-line bg-surface">
        {items && items.length === 0 ? (
          <p className="px-5 py-10 text-center text-small text-muted">Aucun rendez-vous ne correspond à ces critères.</p>
        ) : (
          <table className="w-full text-left text-small">
            <caption className="sr-only">Rendez-vous</caption>
            <thead className="hidden border-b border-line bg-paper text-micro font-semibold text-muted md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3">Date</th>
                <th scope="col" className="px-3 py-3">Patient</th>
                <th scope="col" className="px-3 py-3">Type</th>
                <th scope="col" className="px-3 py-3">Statut</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(items ?? []).map((a) => (
                <tr key={a.id} className="block px-4 py-3 md:table-row md:p-0">
                  <td className="block md:table-cell md:px-5 md:py-3">
                    <span className="font-semibold first-letter:uppercase">{formatLongDate(a.startAt, TZ).replace(/ \d{4}$/, "")}</span>
                    <span className="ml-2 tabular-nums text-muted md:ml-0 md:block">{localTime(a.startAt, TZ).replace(":", "h")} · {a.duration} min</span>
                  </td>
                  <td className="block md:table-cell md:px-3 md:py-3">
                    <span className="font-medium">{a.firstName} {a.lastName}</span>
                    <span className="block text-micro text-muted">{a.phone} · {a.email}</span>
                  </td>
                  <td className="block text-muted md:table-cell md:px-3 md:py-3">{a.serviceName}</td>
                  <td className="mt-1 block md:table-cell md:px-3 md:py-3"><StatusBadge status={a.status} /></td>
                  <td className="mt-2 block md:table-cell md:px-5 md:py-3 md:text-right">
                    <Button size="sm" variant="secondary" onClick={() => setModal({ mode: "edit", appointment: a })}>
                      Ouvrir<span className="sr-only"> le rendez-vous de {a.firstName} {a.lastName}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AppointmentModal state={modal} services={services} onClose={() => setModal(null)} onChanged={load} />
    </div>
  );
}
