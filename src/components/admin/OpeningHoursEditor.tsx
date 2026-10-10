"use client";

import { useEffect, useState } from "react";
import type { AvailabilityRule } from "@/lib/booking/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { adminApi, AdminPageHeader, Notice } from "./shared";

const DAYS = [
  { dow: 1, label: "Lundi" },
  { dow: 2, label: "Mardi" },
  { dow: 3, label: "Mercredi" },
  { dow: 4, label: "Jeudi" },
  { dow: 5, label: "Vendredi" },
  { dow: 6, label: "Samedi" },
  { dow: 0, label: "Dimanche" },
];

type Range = { startTime: string; endTime: string };

/** Horaires d'ouverture hebdomadaires (base des créneaux proposés et de l'affichage public) */
export function OpeningHoursEditor() {
  const [week, setWeek] = useState<Record<number, Range[]> | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const fromRules = (rules: AvailabilityRule[]) => {
    const w: Record<number, Range[]> = {};
    for (const d of DAYS) w[d.dow] = rules.filter((r) => r.enabled && r.dayOfWeek === d.dow).map((r) => ({ startTime: r.startTime, endTime: r.endTime }));
    return w;
  };

  useEffect(() => {
    adminApi<{ availability: AvailabilityRule[] }>("/api/admin/availability").then((r) => {
      if (r.ok) setWeek(fromRules(r.data.availability));
      else setMessage({ tone: "error", text: String(r.data.message) });
    });
  }, []);

  const update = (dow: number, fn: (list: Range[]) => Range[]) => setWeek((w) => (w ? { ...w, [dow]: fn(w[dow]) } : w));

  const save = async () => {
    if (!week) return;
    setBusy(true);
    setMessage(null);
    const availability = DAYS.flatMap((d) => week[d.dow].map((r) => ({ dayOfWeek: d.dow, ...r, enabled: true })));
    const r = await adminApi<{ availability: AvailabilityRule[] }>("/api/admin/availability", { method: "PUT", body: JSON.stringify({ availability }) });
    setBusy(false);
    if (r.ok) {
      setWeek(fromRules(r.data.availability));
      setMessage({ tone: "ok", text: "Horaires enregistrés. Ils s'appliquent aux réservations et à l'affichage sur le site." });
    } else setMessage({ tone: "error", text: String(r.data.message) });
  };

  const input = "field w-[7.5rem] py-2 tabular-nums";

  return (
    <div>
      <AdminPageHeader
        title="Horaires"
        description="Plages pendant lesquelles les patients peuvent réserver. Pour une pause (ex. déjeuner), créez deux plages."
        actions={
          <Button onClick={save} disabled={busy || !week}>
            {busy ? "Enregistrement…" : "Enregistrer les horaires"}
          </Button>
        }
      />
      {message && (
        <div className="mt-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}

      <div className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
        {!week ? (
          <p className="px-5 py-8 text-small text-muted">Chargement…</p>
        ) : (
          DAYS.map((d) => {
            const list = week[d.dow];
            return (
              <div key={d.dow} className="grid gap-3 px-5 py-4 md:grid-cols-[9rem_1fr] md:items-start">
                <div className="flex items-center justify-between md:block">
                  <p className="font-semibold">{d.label}</p>
                  <p className="text-micro text-muted md:mt-1">{list.length === 0 ? "Fermé" : `${list.length} plage${list.length > 1 ? "s" : ""}`}</p>
                </div>
                <div className="space-y-2">
                  {list.map((r, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`h-${d.dow}-${i}-s`}>{d.label}, début de la plage {i + 1}</label>
                      <input id={`h-${d.dow}-${i}-s`} type="time" step={300} value={r.startTime} onChange={(e) => update(d.dow, (l) => l.map((x, j) => (j === i ? { ...x, startTime: e.target.value } : x)))} className={input} />
                      <span className="text-muted">à</span>
                      <label className="sr-only" htmlFor={`h-${d.dow}-${i}-e`}>{d.label}, fin de la plage {i + 1}</label>
                      <input id={`h-${d.dow}-${i}-e`} type="time" step={300} value={r.endTime} onChange={(e) => update(d.dow, (l) => l.map((x, j) => (j === i ? { ...x, endTime: e.target.value } : x)))} className={input} />
                      <button type="button" onClick={() => update(d.dow, (l) => l.filter((_, j) => j !== i))} className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-mist hover:text-danger">
                        <Icon name="close" size={18} />
                        <span className="sr-only">Supprimer la plage {i + 1} du {d.label.toLowerCase()}</span>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => update(d.dow, (l) => [...l, l.length ? { startTime: "14:00", endTime: "18:00" } : { startTime: "08:30", endTime: "12:00" }])}
                    className="link text-small"
                  >
                    {list.length ? "Ajouter une plage" : "Ouvrir ce jour"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-4 text-micro text-muted">
        Les rendez-vous déjà pris ne sont pas modifiés. Les congés et indisponibilités ponctuelles se gèrent dans leurs rubriques.
      </p>
    </div>
  );
}
