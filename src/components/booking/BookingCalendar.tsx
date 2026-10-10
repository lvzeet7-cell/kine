"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { DayAvailability, DayStatus } from "@/lib/booking/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

const WEEKDAYS = [
  { short: "Lu", long: "lundi" },
  { short: "Ma", long: "mardi" },
  { short: "Me", long: "mercredi" },
  { short: "Je", long: "jeudi" },
  { short: "Ve", long: "vendredi" },
  { short: "Sa", long: "samedi" },
  { short: "Di", long: "dimanche" },
];

const STATUS_TEXT: Record<DayStatus, string> = {
  available: "disponible",
  full: "complet",
  closed: "cabinet fermé",
  unavailable: "aucun créneau",
  past: "date passée",
  beyond: "réservation pas encore ouverte",
};

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const s = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

type Props = {
  month: string;
  days: DayAvailability[] | null;
  selected: string | null;
  today: string;
  loading: boolean;
  error: string | null;
  canPrev: boolean;
  canNext: boolean;
  onMonthChange: (delta: number) => void;
  onSelect: (date: string) => void;
  onRetry: () => void;
};

/** Calendrier mensuel des disponibilités — navigation au clavier (flèches, début/fin) */
export function BookingCalendar({ month, days, selected, today, loading, error, canPrev, canNext, onMonthChange, onSelect, onRetry }: Props) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const offset = (first + 6) % 7;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDate = new Map((days ?? []).map((d) => [d.date, d]));
  const dates = Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);

  const initialFocus = () => {
    const idx = dates.indexOf(selected ?? "");
    if (idx >= 0) return idx;
    const firstAvailable = dates.findIndex((d) => byDate.get(d)?.status === "available");
    return firstAvailable >= 0 ? firstAvailable : 0;
  };
  const [focusIdx, setFocusIdx] = useState(initialFocus);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const keyboardMove = useRef(false);

  useEffect(() => {
    setFocusIdx(initialFocus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, days]);

  useEffect(() => {
    if (keyboardMove.current) {
      buttons.current[focusIdx]?.focus();
      keyboardMove.current = false;
    }
  }, [focusIdx]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next = i;
    if (e.key in moves) next = i + moves[e.key];
    else if (e.key === "Home") next = i - ((i + offset) % 7);
    else if (e.key === "End") next = i + (6 - ((i + offset) % 7));
    else return;
    e.preventDefault();
    next = Math.max(0, Math.min(count - 1, next));
    keyboardMove.current = true;
    setFocusIdx(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-h3" aria-live="polite">
          {monthLabel(month)}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(-1)}
            disabled={!canPrev}
            className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-line bg-surface text-ink transition-colors hover:border-petrol/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="chevronLeft" size={20} />
            <span className="sr-only">Mois précédent</span>
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(1)}
            disabled={!canNext}
            className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-line bg-surface text-ink transition-colors hover:border-petrol/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="chevronRight" size={20} />
            <span className="sr-only">Mois suivant</span>
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5" role="presentation">
          {WEEKDAYS.map((w) => (
            <abbr key={w.short} title={w.long} className="pb-2 text-micro font-semibold text-muted no-underline">
              {w.short}
            </abbr>
          ))}
        </div>

        {error ? (
          <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-card bg-mist/60 p-6 text-center text-small">
            <p className="text-ink">{error}</p>
            <button type="button" onClick={onRetry} className="link">
              Réessayer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5" aria-busy={loading || !days}>
            {Array.from({ length: offset }, (_, i) => (
              <span key={`e${i}`} aria-hidden="true" />
            ))}
            {dates.map((date, i) => {
              const info = byDate.get(date);
              const status: DayStatus | undefined = info?.status;
              const available = status === "available";
              const isSelected = selected === date;
              const isToday = date === today;
              const label = `${dayLabel(date)}, ${status ? STATUS_TEXT[status] : "chargement"}${
                available && info ? `, ${info.slots} créneau${info.slots > 1 ? "x" : ""}` : ""
              }`;
              return (
                <button
                  key={date}
                  ref={(el) => {
                    buttons.current[i] = el;
                  }}
                  type="button"
                  tabIndex={i === focusIdx ? 0 : -1}
                  aria-label={label}
                  aria-pressed={isSelected}
                  aria-disabled={!available}
                  onClick={() => available && onSelect(date)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  onFocus={() => setFocusIdx(i)}
                  className={cn(
                    "relative flex aspect-square min-h-[2.5rem] flex-col items-center justify-center rounded-control text-small tabular-nums transition-[background-color,border-color,color] duration-150 sm:min-h-[2.75rem] sm:text-body",
                    !days && "animate-pulse bg-mist text-transparent",
                    days && available && !isSelected && "border border-line bg-surface font-semibold text-ink hover:border-petrol hover:bg-petrol-soft/50",
                    days && isSelected && "bg-petrol font-semibold text-white shadow-lift",
                    days && status === "full" && "cursor-not-allowed bg-mist/70 text-muted line-through decoration-muted/60",
                    days && status && !available && status !== "full" && "cursor-not-allowed text-muted/45",
                  )}
                >
                  {Number(date.slice(8))}
                  {days && available && !isSelected && (
                    <span aria-hidden="true" className="absolute bottom-1.5 h-1 w-1 rounded-full bg-sage-deep sm:bottom-2" />
                  )}
                  {isToday && (
                    <span aria-hidden="true" className={cn("absolute top-1 text-[0.5625rem] font-semibold uppercase tracking-wide", isSelected ? "text-white/80" : "text-petrol")}>
                      auj.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {loading && days && (
          <div className="absolute inset-0 top-7 flex items-center justify-center rounded-card bg-paper/60" aria-hidden="true">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-petrol/30 border-t-petrol" />
          </div>
        )}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-micro text-muted" aria-label="Légende">
        <li className="flex items-center gap-2">
          <span className="relative h-4 w-4 rounded border border-line bg-surface">
            <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sage-deep" />
          </span>
          Disponible
        </li>
        <li className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-mist" />
          Complet
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center text-[0.625rem] text-muted/50">12</span>
          Fermé ou indisponible
        </li>
      </ul>
    </div>
  );
}
