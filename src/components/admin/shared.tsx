"use client";

import { api } from "@/components/booking/hooks";
import type { Appointment, AppointmentStatus } from "@/lib/booking/types";
import { STATUS_LABELS } from "@/lib/booking/types";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type AdminAppointment = Omit<Appointment, "managementTokenHash">;

/** Appel API admin ; renvoie vers la connexion si la session a expiré */
export async function adminApi<T>(url: string, init?: RequestInit) {
  const r = await api<T>(url, init);
  if (!r.ok && r.status === 401 && typeof window !== "undefined") {
    window.location.href = `/admin/connexion?suite=${encodeURIComponent(window.location.pathname)}`;
  }
  return r;
}

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-petrol-soft text-petrol",
  COMPLETED: "bg-sage-soft text-sage-deep",
  CANCELLED: "bg-danger/10 text-danger",
  NO_SHOW: "bg-mist text-ink",
};

/** Couleur de fond des blocs dans l'agenda */
export const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  PENDING: "border-l-warning bg-warning-soft text-ink",
  CONFIRMED: "border-l-petrol bg-petrol-soft text-ink",
  COMPLETED: "border-l-sage-deep bg-sage-soft text-ink",
  CANCELLED: "border-l-danger bg-danger/5 text-muted line-through",
  NO_SHOW: "border-l-muted bg-mist text-muted",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-micro font-semibold", STATUS_STYLE[status], className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
        {description && <p className="mt-1.5 text-small text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "error" | "ok" | "info"; children: ReactNode }) {
  const styles = {
    error: "border border-danger/30 bg-danger/5",
    ok: "bg-sage-soft",
    info: "bg-mist",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-card p-4 text-small text-ink", styles[tone])}>
      {children}
    </div>
  );
}
