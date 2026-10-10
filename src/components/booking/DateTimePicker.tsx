"use client";

import { useEffect, useRef, useState } from "react";
import type { Slot } from "@/lib/booking/types";
import { AvailableSlots } from "./AvailableSlots";
import { BookingCalendar } from "./BookingCalendar";
import { monthOf, shiftMonth, useDaySlots, useMonthAvailability } from "./hooks";

/**
 * Choix de la date puis de l'horaire.
 * Utilisé par la réservation et par la page de gestion (déplacement).
 */
export function DateTimePicker({
  serviceId,
  today,
  lastDate,
  date,
  slot,
  onDateChange,
  onSlotChange,
  refreshKey = 0,
}: {
  serviceId: string;
  today: string;
  lastDate: string;
  date: string | null;
  slot: Slot | null;
  onDateChange: (date: string | null) => void;
  onSlotChange: (slot: Slot | null) => void;
  refreshKey?: number;
}) {
  const [month, setMonth] = useState(monthOf(date ?? today));
  const minMonth = monthOf(today);
  const maxMonth = monthOf(lastDate);
  const availability = useMonthAvailability(serviceId, month);
  const day = useDaySlots(serviceId, date);

  // Actualisation demandée par le parent (ex. créneau pris entre-temps)
  const { refresh: refreshMonth } = availability;
  const { refresh: refreshDay } = day;
  useEffect(() => {
    if (refreshKey > 0) {
      refreshMonth();
      refreshDay();
    }
  }, [refreshKey, refreshMonth, refreshDay]);

  // Si le mois en cours n'a plus aucune disponibilité, afficher directement le mois suivant (une seule fois)
  const autoAdvanced = useRef(false);
  useEffect(() => {
    if (autoAdvanced.current || date || !availability.days || month >= maxMonth) return;
    autoAdvanced.current = true;
    if (!availability.days.some((d) => d.status === "available")) setMonth((m) => shiftMonth(m, 1));
  }, [availability.days, date, month, maxMonth]);

  const pickDate = (d: string) => {
    onDateChange(d);
    onSlotChange(null);
    if (monthOf(d) !== month) setMonth(monthOf(d));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
      <BookingCalendar
        month={month}
        days={availability.days}
        selected={date}
        today={today}
        loading={availability.loading}
        error={availability.error}
        canPrev={month > minMonth}
        canNext={month < maxMonth}
        onMonthChange={(delta) => setMonth((m) => shiftMonth(m, delta))}
        onSelect={pickDate}
        onRetry={availability.refresh}
      />
      <div className="min-w-0 lg:border-l lg:border-line lg:pl-10">
        <AvailableSlots
          date={date}
          slots={day.slots}
          loading={day.loading}
          error={day.error}
          selected={slot?.startAt ?? null}
          nextDate={day.nextDate}
          onSelect={onSlotChange}
          onNextDate={pickDate}
          onRetry={day.refresh}
        />
      </div>
    </div>
  );
}
