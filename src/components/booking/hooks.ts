"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DayAvailability, Slot } from "@/lib/booking/types";

export const GENERIC_ERROR = "Une erreur est survenue. Veuillez réessayer dans quelques instants.";

/** Appel JSON avec message d'erreur humain */
export async function api<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T };
    return { ok: false, status: res.status, data: { message: GENERIC_ERROR, ...data } };
  } catch {
    return { ok: false, status: 0, data: { message: "Connexion impossible. Vérifiez votre connexion internet puis réessayez." } };
  }
}

/** Disponibilités d'un mois (avec cache) */
export function useMonthAvailability(serviceId: string | null, month: string) {
  const cache = useRef(new Map<string, DayAvailability[]>());
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!serviceId) return;
    const key = `${serviceId}|${month}`;
    const cached = cache.current.get(key);
    if (cached) {
      setDays(cached);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<{ days: DayAvailability[] }>(`/api/booking/availability?service=${encodeURIComponent(serviceId)}&month=${month}`).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (r.ok) {
        cache.current.set(key, r.data.days);
        setDays(r.data.days);
      } else {
        setDays(null);
        setError(String(r.data.message));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serviceId, month, version]);

  const refresh = useCallback(() => {
    cache.current.clear();
    setVersion((v) => v + 1);
  }, []);

  return { days, error, loading, refresh };
}

/** Créneaux d'une journée */
export function useDaySlots(serviceId: string | null, date: string | null) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<{ slots: Slot[]; nextAvailableDate: string | null }>(
      `/api/booking/slots?service=${encodeURIComponent(serviceId)}&date=${date}`,
    ).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (r.ok) {
        setSlots(r.data.slots);
        setNextDate(r.data.nextAvailableDate);
      } else {
        setSlots(null);
        setError(String(r.data.message));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { slots, nextDate, error, loading, refresh };
}

export const monthOf = (date: string) => date.slice(0, 7);

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
