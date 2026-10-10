"use client";

import type { Slot } from "@/lib/booking/types";
import { formatLocalDate } from "@/lib/booking/time";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

const PERIODS = [
  { label: "Matin", test: (t: string) => t < "12:00" },
  { label: "Après-midi", test: (t: string) => t >= "12:00" && t < "18:00" },
  { label: "Soir", test: (t: string) => t >= "18:00" },
];

type Props = {
  date: string | null;
  slots: Slot[] | null;
  loading: boolean;
  error: string | null;
  selected: string | null;
  nextDate: string | null;
  onSelect: (slot: Slot) => void;
  onNextDate: (date: string) => void;
  onRetry: () => void;
};

/** Créneaux disponibles d'une journée, regroupés par moment de la journée */
export function AvailableSlots({ date, slots, loading, error, selected, nextDate, onSelect, onNextDate, onRetry }: Props) {
  if (!date) {
    return (
      <div className="flex h-full min-h-[10rem] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line p-6 text-center">
        <Icon name="calendar" size={24} className="text-sage-deep" />
        <p className="text-small text-muted">Choisissez une date dans le calendrier pour voir les horaires disponibles.</p>
      </div>
    );
  }

  const title = formatLocalDate(date);

  return (
    <div>
      <h3 className="text-h3">
        <span className="sr-only">Horaires disponibles le </span>
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </h3>

      <div className="mt-4" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="grid grid-cols-3 gap-2 xs:grid-cols-4" aria-label="Recherche des disponibilités">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="h-12 animate-pulse rounded-control bg-mist" />
            ))}
            <span className="sr-only">Recherche des disponibilités…</span>
          </div>
        ) : error ? (
          <div className="rounded-card bg-mist/60 p-5 text-small">
            <p className="text-ink">{error}</p>
            <button type="button" onClick={onRetry} className="link mt-2">
              Réessayer
            </button>
          </div>
        ) : slots && slots.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-5 text-small">
            <p className="text-ink">Aucun créneau disponible pour cette journée.</p>
            {nextDate && (
              <button type="button" onClick={() => onNextDate(nextDate)} className="link mt-3 inline-flex items-center gap-1">
                Voir le jour suivant disponible
                <Icon name="chevronRight" size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {PERIODS.map((p) => {
              const list = (slots ?? []).filter((s) => p.test(s.time));
              if (!list.length) return null;
              return (
                <fieldset key={p.label}>
                  <legend className="mb-2 text-micro font-semibold text-muted">{p.label}</legend>
                  <div className="grid grid-cols-3 gap-2 xs:grid-cols-4">
                    {list.map((s) => {
                      const active = selected === s.startAt;
                      return (
                        <button
                          key={s.startAt}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onSelect(s)}
                          className={cn(
                            "h-12 rounded-control border text-small font-semibold tabular-nums transition-[background-color,border-color,color] duration-150",
                            active
                              ? "border-petrol bg-petrol text-white shadow-lift"
                              : "border-line bg-surface text-ink hover:border-petrol hover:bg-petrol-soft/50",
                          )}
                        >
                          {s.time.replace(":", "h")}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
