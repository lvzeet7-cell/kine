"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BookingService } from "@/lib/booking/config";
import { formatLongDate, localTime } from "@/lib/booking/time";
import type { AdminNotification } from "@/lib/booking/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AppointmentModal, type ModalState } from "./AppointmentModal";
import { adminApi, AdminPageHeader, Notice, StatusBadge, type AdminAppointment } from "./shared";
import { bookingConfig } from "@/lib/booking/config";

const TZ = bookingConfig.timezone;

type Dashboard = {
  today: string;
  total: number;
  cancelled: number;
  pending: number;
  byService: Record<string, number>;
  todays: AdminAppointment[];
  upcoming: AdminAppointment[];
  notifications: AdminNotification[];
};

const NOTIF_ICON = { NEW: "calendar", CANCELLED: "close", RESCHEDULED: "clock", TELE_JOINED: "phone", TELE_ISSUE: "alert" } as const;

function AppointmentRow({ a, onOpen, showDate }: { a: AdminAppointment; onOpen: () => void; showDate?: boolean }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-paper sm:px-5">
        <span className="w-14 shrink-0">
          <span className="block text-small font-semibold tabular-nums">{localTime(a.startAt, TZ).replace(":", "h")}</span>
          {showDate && <span className="block text-[0.6875rem] text-muted">{new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short" }).format(new Date(a.startAt))}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {a.firstName} {a.lastName}
          </span>
          <span className="block truncate text-micro text-muted">
            {a.serviceName} · {a.duration} min
          </span>
        </span>
        <StatusBadge status={a.status} className="hidden xs:inline-flex" />
      </button>
    </li>
  );
}

export function AdminDashboard({ services }: { services: BookingService[] }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    const r = await adminApi<Dashboard>("/api/admin/dashboard");
    if (r.ok) setData(r.data);
    else setError(String(r.data.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await adminApi("/api/admin/notifications", { method: "POST", body: JSON.stringify({}) });
    load();
  };

  const unread = data?.notifications.filter((n) => !n.readAt).length ?? 0;
  const todayLabel = data ? formatLongDate(`${data.today}T12:00:00.000Z`, TZ) : "";

  return (
    <div>
      <AdminPageHeader
        title="Tableau de bord"
        description={todayLabel ? todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1) : undefined}
        actions={
          <>
            <Button variant="secondary" onClick={() => setModal({ mode: "create" })}>
              Nouveau rendez-vous
            </Button>
            <Link href="/admin/agenda" className="inline-flex h-12 items-center gap-2 rounded-control bg-petrol px-5 text-[0.975rem] font-semibold text-white hover:bg-petrol-deep">
              <Icon name="calendar" size={18} />
              Ouvrir l&apos;agenda
            </Link>
          </>
        }
      />

      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {/* Chiffres du jour */}
      <section aria-labelledby="today-title" className="mt-8">
        <h2 id="today-title" className="text-small font-semibold text-muted">
          Aujourd&apos;hui
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-[2rem] font-semibold leading-none tabular-nums">{data ? data.total : "–"}</p>
            <p className="mt-2 text-small text-muted">rendez-vous</p>
          </div>
          {data &&
            Object.entries(data.byService)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([name, n]) => (
                <div key={name} className="rounded-card border border-line bg-surface p-5">
                  <p className="text-[2rem] font-semibold leading-none tabular-nums">{n}</p>
                  <p className="mt-2 truncate text-small text-muted">{name.toLowerCase()}</p>
                </div>
              ))}
          <div className="rounded-card border border-line bg-surface p-5">
            <p className={cn("text-[2rem] font-semibold leading-none tabular-nums", data && data.cancelled > 0 && "text-danger")}>{data ? data.cancelled : "–"}</p>
            <p className="mt-2 text-small text-muted">annulation{data && data.cancelled > 1 ? "s" : ""}</p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section aria-labelledby="list-today" className="rounded-card border border-line bg-surface">
            <h2 id="list-today" className="border-b border-line px-5 py-4 font-semibold">
              Rendez-vous du jour
            </h2>
            {!data ? (
              <p className="px-5 py-6 text-small text-muted">Chargement…</p>
            ) : data.todays.length === 0 ? (
              <p className="px-5 py-6 text-small text-muted">Aucun rendez-vous aujourd&apos;hui.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.todays.map((a) => (
                  <AppointmentRow key={a.id} a={a} onOpen={() => setModal({ mode: "edit", appointment: a })} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="list-next" className="rounded-card border border-line bg-surface">
            <h2 id="list-next" className="flex items-center justify-between border-b border-line px-5 py-4 font-semibold">
              Prochains rendez-vous
              <Link href="/admin/rendez-vous" className="link text-small font-medium">
                Tout voir
              </Link>
            </h2>
            {!data ? (
              <p className="px-5 py-6 text-small text-muted">Chargement…</p>
            ) : data.upcoming.length === 0 ? (
              <p className="px-5 py-6 text-small text-muted">Aucun rendez-vous à venir.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.upcoming.map((a) => (
                  <AppointmentRow key={a.id} a={a} showDate onOpen={() => setModal({ mode: "edit", appointment: a })} />
                ))}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="notifs" className="self-start rounded-card border border-line bg-surface">
          <h2 id="notifs" className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 font-semibold">
            <span>
              Notifications
              {unread > 0 && <span className="ml-2 rounded-full bg-petrol px-2 py-0.5 text-micro text-white">{unread}</span>}
            </span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="link text-small font-medium">
                Tout marquer comme lu
              </button>
            )}
          </h2>
          {!data || data.notifications.length === 0 ? (
            <p className="px-5 py-6 text-small text-muted">{data ? "Aucune notification." : "Chargement…"}</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.notifications.map((n) => (
                <li key={n.id} className={cn("flex gap-3 px-5 py-3.5", !n.readAt && "bg-petrol-soft/40")}>
                  <Icon name={NOTIF_ICON[n.type]} size={18} className={cn("mt-0.5 shrink-0", n.type === "CANCELLED" ? "text-danger" : "text-petrol")} />
                  <div className="min-w-0">
                    <p className="text-small text-ink">{n.message}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-muted">
                      {new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(n.createdAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <AppointmentModal state={modal} services={services} onClose={() => setModal(null)} onChanged={load} />
    </div>
  );
}
