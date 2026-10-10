"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import type { BookingService } from "@/lib/booking/config";
import { addDays, dayOfWeek, localDate, localTime, timeToMinutes, minutesToTime } from "@/lib/booking/time";
import type { AvailabilityRule, Closure, Unavailability } from "@/lib/booking/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AppointmentModal, type ModalState } from "./AppointmentModal";
import { adminApi, AdminPageHeader, Notice, STATUS_BLOCK, StatusBadge, type AdminAppointment } from "./shared";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;
type View = "day" | "week" | "month";
const HOUR_PX = 56;
const PX_PER_MIN = HOUR_PX / 60;

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, d)));
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const mondayOf = (date: string) => addDays(date, -((dayOfWeek(date) + 6) % 7));

function rangeFor(view: View, cursor: string): { start: string; end: string; days: string[] } {
  if (view === "day") return { start: cursor, end: cursor, days: [cursor] };
  if (view === "week") {
    const start = mondayOf(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return { start, end: days[6], days };
  }
  const first = `${cursor.slice(0, 7)}-01`;
  const start = mondayOf(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return { start, end: days[41], days };
}

function titleFor(view: View, cursor: string, days: string[]) {
  if (view === "day") return cap(fmt(cursor, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  if (view === "month") return cap(fmt(cursor, { month: "long", year: "numeric" }));
  const a = days[0];
  const b = days[6];
  const sameMonth = a.slice(0, 7) === b.slice(0, 7);
  return `Semaine du ${fmt(a, sameMonth ? { day: "numeric" } : { day: "numeric", month: "long" })} au ${fmt(b, { day: "numeric", month: "long", year: "numeric" })}`;
}

/** Répartit les rendez-vous qui se chevauchent sur plusieurs colonnes */
function layoutLanes(items: AdminAppointment[]) {
  const sorted = [...items].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const laneEnds: string[] = [];
  const placed = sorted.map((a) => {
    let lane = laneEnds.findIndex((end) => end <= a.startAt);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(a.endAt);
    } else laneEnds[lane] = a.endAt;
    return { a, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

export function AdminCalendar({ services }: { services: BookingService[] }) {
  const today = localDate(new Date(), TZ);
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(today);
  const [appointments, setAppointments] = useState<AdminAppointment[] | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [hideCancelled, setHideCancelled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    if (mq.matches) setView("day");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const range = useMemo(() => rangeFor(view, cursor), [view, cursor]);

  const load = useCallback(async () => {
    setError(null);
    const [a, av, cl, un] = await Promise.all([
      adminApi<{ appointments: AdminAppointment[] }>(`/api/admin/appointments?from=${range.start}&to=${range.end}&limit=500`),
      adminApi<{ availability: AvailabilityRule[] }>("/api/admin/availability"),
      adminApi<{ closures: Closure[] }>("/api/admin/closures"),
      adminApi<{ unavailabilities: Unavailability[] }>(`/api/admin/unavailabilities?from=${range.start}`),
    ]);
    if (!a.ok) {
      setError(String(a.data.message));
      return;
    }
    setAppointments(a.data.appointments);
    if (av.ok) setAvailability(av.data.availability);
    if (cl.ok) setClosures(cl.data.closures);
    if (un.ok) setUnavailabilities(un.data.unavailabilities);
  }, [range.start, range.end]);

  useEffect(() => {
    load();
  }, [load]);

  const move = (delta: number) => {
    if (view === "day") setCursor((c) => addDays(c, delta));
    else if (view === "week") setCursor((c) => addDays(c, delta * 7));
    else {
      const [y, m] = cursor.split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1 + delta, 1));
      setCursor(d.toISOString().slice(0, 10));
    }
  };

  const visible = (appointments ?? []).filter((a) => !hideCancelled || a.status !== "CANCELLED");
  const byDay = (date: string) => visible.filter((a) => localDate(a.startAt, TZ) === date);
  const closureFor = (date: string) => closures.find((c) => date >= c.startDate && date <= c.endDate);

  // Amplitude horaire affichée : horaires d'ouverture ± 1 h, au minimum 8 h – 19 h
  const enabled = availability.filter((r) => r.enabled);
  const startHour = Math.max(0, Math.min(8, ...enabled.map((r) => Math.floor(timeToMinutes(r.startTime) / 60))) - (enabled.length ? 0 : 0));
  const endHour = Math.min(24, Math.max(19, ...enabled.map((r) => Math.ceil(timeToMinutes(r.endTime) / 60))) + 1);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const openRanges = (date: string) =>
    enabled.filter((r) => r.dayOfWeek === dayOfWeek(date)).map((r) => [timeToMinutes(r.startTime), timeToMinutes(r.endTime)] as const);

  const clickGrid = (date: string, e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const min = Math.floor((y / PX_PER_MIN + startHour * 60) / 15) * 15;
    setModal({ mode: "create", defaults: { date, time: minutesToTime(Math.min(min, 23 * 60 + 45)) } });
  };

  const summary = {
    total: visible.filter((a) => a.status !== "CANCELLED").length,
  };

  return (
    <div>
      <AdminPageHeader
        title="Agenda"
        description={appointments ? `${summary.total} rendez-vous sur la période affichée` : "Chargement…"}
        actions={
          <Button onClick={() => setModal({ mode: "create", defaults: { date: view === "day" ? cursor : today } })}>
            <Icon name="plus" size={18} className="[&_rect]:hidden" />
            Nouveau rendez-vous
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setCursor(today)}>
            Aujourd&apos;hui
          </Button>
          <button type="button" onClick={() => move(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-surface hover:border-petrol/40">
            <Icon name="chevronLeft" size={18} />
            <span className="sr-only">Période précédente</span>
          </button>
          <button type="button" onClick={() => move(1)} className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-surface hover:border-petrol/40">
            <Icon name="chevronRight" size={18} />
            <span className="sr-only">Période suivante</span>
          </button>
          <h2 className="ml-1 text-small font-semibold sm:text-body" aria-live="polite">
            {titleFor(view, cursor, range.days)}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-small text-muted">
            <input type="checkbox" checked={hideCancelled} onChange={(e) => setHideCancelled(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--petrol))]" />
            Masquer les annulés
          </label>
          <div role="group" aria-label="Vue" className="inline-flex rounded-control border border-line bg-surface p-1">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn("rounded-[0.5rem] px-3 py-1.5 text-small font-medium", view === v ? "bg-petrol text-white" : "text-ink hover:bg-mist")}
              >
                {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {/* Vue mois */}
      {view === "month" && (
        <div className="mt-6 overflow-hidden rounded-card border border-line bg-surface">
          <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-micro font-semibold text-muted">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {range.days.map((date) => {
              const list = byDay(date);
              const inMonth = date.slice(0, 7) === cursor.slice(0, 7);
              const closed = closureFor(date);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    setCursor(date);
                    setView("day");
                  }}
                  className={cn(
                    "min-h-[5.5rem] border-b border-r border-line p-1.5 text-left align-top transition-colors hover:bg-petrol-soft/40 sm:min-h-[7rem] sm:p-2 [&:nth-child(7n)]:border-r-0",
                    !inMonth && "bg-paper/70 text-muted/60",
                    closed && "bg-mist/60",
                  )}
                  aria-label={`${fmt(date, { weekday: "long", day: "numeric", month: "long" })} : ${list.length} rendez-vous${closed ? ", fermé" : ""}`}
                >
                  <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-full text-micro font-semibold tabular-nums", date === today && "bg-petrol px-1.5 text-white")}>
                    {Number(date.slice(8))}
                  </span>
                  {closed && <span className="ml-1 hidden text-[0.6875rem] text-muted sm:inline">Fermé</span>}
                  <span className="mt-1 block space-y-0.5" aria-hidden="true">
                    {list.slice(0, 3).map((a) => (
                      <span key={a.id} className={cn("block truncate rounded border-l-2 px-1 text-[0.6875rem] leading-5", STATUS_BLOCK[a.status])}>
                        <span className="tabular-nums">{localTime(a.startAt, TZ).replace(":", "h")}</span>
                        <span className="hidden sm:inline"> {a.lastName}</span>
                      </span>
                    ))}
                    {list.length > 3 && <span className="block text-[0.6875rem] text-muted">+{list.length - 3}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vue semaine sur petit écran : liste par jour */}
      {view === "week" && isNarrow && (
        <div className="mt-6 space-y-4">
          {range.days.map((date) => {
            const list = byDay(date);
            const closed = closureFor(date);
            return (
              <section key={date} className="rounded-card border border-line bg-surface">
                <h3 className="flex items-center justify-between border-b border-line px-4 py-3 text-small font-semibold">
                  <span className={date === today ? "text-petrol" : ""}>{cap(fmt(date, { weekday: "long", day: "numeric", month: "long" }))}</span>
                  <button type="button" onClick={() => setModal({ mode: "create", defaults: { date } })} className="link text-micro">
                    Ajouter
                  </button>
                </h3>
                {closed ? (
                  <p className="px-4 py-3 text-small text-muted">Fermé{closed.reason ? ` — ${closed.reason}` : ""}</p>
                ) : list.length === 0 ? (
                  <p className="px-4 py-3 text-small text-muted">Aucun rendez-vous</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {list.map((a) => (
                      <li key={a.id}>
                        <button type="button" onClick={() => setModal({ mode: "edit", appointment: a })} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper">
                          <span className="w-12 shrink-0 text-small font-semibold tabular-nums">{localTime(a.startAt, TZ).replace(":", "h")}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{a.firstName} {a.lastName}</span>
                            <span className="block truncate text-micro text-muted">{a.serviceName} · {a.duration} min</span>
                          </span>
                          <StatusBadge status={a.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Vues jour et semaine : grille horaire */}
      {(view === "day" || (view === "week" && !isNarrow)) && (
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
          <div className={cn("grid", view === "week" ? "min-w-[52rem] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]" : "grid-cols-[3.5rem_minmax(0,1fr)]")}>
            {/* En-têtes */}
            <div className="sticky top-0 z-10 border-b border-line bg-paper" />
            {range.days.map((date) => {
              const closed = closureFor(date);
              return (
                <div key={date} className={cn("sticky top-0 z-10 border-b border-l border-line bg-paper px-2 py-2 text-center", date === today && "text-petrol")}>
                  <p className="text-micro font-semibold uppercase tracking-wide text-muted">{fmt(date, { weekday: "short" })}</p>
                  <p className={cn("text-body font-semibold tabular-nums", date === today && "text-petrol")}>{Number(date.slice(8))}</p>
                  {closed && <p className="truncate text-[0.6875rem] text-muted">Fermé</p>}
                </div>
              );
            })}

            {/* Graduation des heures */}
            <div className="relative" style={{ height: hours.length * HOUR_PX }}>
              {hours.map((h, i) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[0.6875rem] tabular-nums text-muted" style={{ top: i * HOUR_PX }}>
                  {i === 0 ? "" : `${h}h`}
                </span>
              ))}
            </div>

            {range.days.map((date) => {
              const closed = closureFor(date);
              const { placed, lanes } = layoutLanes(byDay(date));
              const open = openRanges(date);
              const unav = unavailabilities.filter((u) => u.date === date);
              return (
                <div
                  key={date}
                  className={cn("relative cursor-copy border-l border-line", closed ? "bg-mist/60" : "bg-mist/40")}
                  style={{
                    height: hours.length * HOUR_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, rgb(var(--line)) 0 1px, transparent 1px ${HOUR_PX}px)`,
                  }}
                  onClick={(e) => clickGrid(date, e)}
                  aria-label={`${fmt(date, { weekday: "long", day: "numeric", month: "long" })} — cliquez sur un horaire libre pour ajouter un rendez-vous`}
                >
                  {/* Heures d'ouverture */}
                  {!closed &&
                    open.map(([s, e]) => (
                      <div
                        key={`${s}-${e}`}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bg-surface"
                        style={{ top: (s - startHour * 60) * PX_PER_MIN, height: (e - s) * PX_PER_MIN, backgroundImage: `repeating-linear-gradient(to bottom, rgb(var(--line)) 0 1px, transparent 1px ${HOUR_PX}px)`, backgroundPosition: `0 ${-((s - startHour * 60) * PX_PER_MIN) % HOUR_PX}px` }}
                      />
                    ))}
                  {/* Indisponibilités */}
                  {unav.map((u) => (
                    <div
                      key={u.id}
                      className="pointer-events-none absolute inset-x-1 overflow-hidden rounded-[0.375rem] border border-dashed border-muted/40 px-1.5 py-1 text-[0.6875rem] text-muted"
                      style={{
                        top: (timeToMinutes(u.startTime) - startHour * 60) * PX_PER_MIN,
                        height: (timeToMinutes(u.endTime) - timeToMinutes(u.startTime)) * PX_PER_MIN,
                        backgroundImage: "repeating-linear-gradient(135deg, rgb(var(--line) / 0.7) 0 1px, transparent 1px 8px)",
                      }}
                    >
                      Indisponible{u.reason ? ` — ${u.reason}` : ""}
                    </div>
                  ))}
                  {/* Rendez-vous */}
                  {placed.map(({ a, lane }) => {
                    const start = timeToMinutes(localTime(a.startAt, TZ));
                    const height = Math.max(a.duration * PX_PER_MIN, 22);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setModal({ mode: "edit", appointment: a })}
                        className={cn(
                          "absolute overflow-hidden rounded-[0.375rem] border-l-[3px] px-1.5 py-1 text-left text-[0.75rem] leading-tight shadow-soft transition-shadow hover:shadow-lift focus-visible:z-20",
                          STATUS_BLOCK[a.status],
                        )}
                        style={{
                          top: (start - startHour * 60) * PX_PER_MIN + 1,
                          height: height - 2,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                        }}
                      >
                        <span className="block font-semibold tabular-nums">
                          {localTime(a.startAt, TZ).replace(":", "h")} {a.lastName}
                        </span>
                        {height > 40 && <span className="block truncate opacity-80">{a.serviceName}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-micro text-muted" aria-label="Légende">
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-l-2 border-l-petrol bg-petrol-soft" />Confirmé</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-l-2 border-l-warning bg-warning-soft" />En attente</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-l-2 border-l-sage-deep bg-sage-soft" />Terminé</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border-l-2 border-l-muted bg-mist" />Absent</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-mist" />Fermé</li>
      </ul>

      <AppointmentModal state={modal} services={services} onClose={() => setModal(null)} onChanged={load} />
    </div>
  );
}
