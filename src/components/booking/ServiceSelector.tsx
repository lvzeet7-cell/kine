"use client";

import type { BookingService } from "@/lib/booking/config";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

/** Choix du type de rendez-vous (boutons radio accessibles) */
export function ServiceSelector({
  services,
  value,
  onChange,
}: {
  services: BookingService[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Type de rendez-vous</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const checked = value === s.id;
          return (
            <label
              key={s.id}
              className={cn(
                "group relative flex cursor-pointer items-start gap-4 rounded-card border bg-surface p-5 transition-[border-color,box-shadow,background-color] duration-200",
                checked ? "border-petrol shadow-[0_0_0_1px_rgb(var(--petrol))] bg-petrol-soft/40" : "border-line hover:border-petrol/40",
                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-petrol/20",
              )}
            >
              <input
                type="radio"
                name="service"
                value={s.id}
                checked={checked}
                onChange={() => onChange(s.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  checked ? "border-petrol bg-petrol" : "border-line group-hover:border-petrol/50",
                )}
              >
                {checked && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{s.name}</span>
                {s.description && <span className="mt-1 block text-small text-muted">{s.description}</span>}
                <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro font-medium text-sage-deep">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" size={15} />
                    {s.duration} minutes
                  </span>
                  {s.mode === "video" && (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="video" size={15} />
                      En ligne, par vidéo
                    </span>
                  )}
                  {s.price && <span className="text-petrol">{s.price}</span>}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
