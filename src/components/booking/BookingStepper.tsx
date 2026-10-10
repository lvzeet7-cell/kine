import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export const BOOKING_STEPS = ["Consultation", "Date", "Coordonnées", "Confirmation"] as const;

/** Indicateur de progression (version compacte sur mobile) */
export function BookingStepper({ current }: { current: number }) {
  return (
    <nav aria-label="Étapes de la réservation">
      {/* Mobile */}
      <div className="sm:hidden">
        <p className="text-small font-semibold text-ink">
          Étape {current + 1} sur {BOOKING_STEPS.length} <span className="font-normal text-muted">· {BOOKING_STEPS[current]}</span>
        </p>
        <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
          {BOOKING_STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 rounded-full", i <= current ? "bg-petrol" : "bg-line")} />
          ))}
        </div>
      </div>

      {/* Tablette et plus */}
      <ol className="hidden items-center gap-3 sm:flex">
        {BOOKING_STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-3" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-micro font-semibold tabular-nums transition-colors duration-200",
                  done && "bg-petrol text-white",
                  active && "bg-petrol text-white ring-4 ring-petrol/15",
                  !done && !active && "border border-line bg-surface text-muted",
                )}
              >
                {done ? <Icon name="check" size={16} className="[&_circle]:hidden" /> : i + 1}
              </span>
              <span className={cn("text-small", active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted")}>
                {label}
                {done && <span className="sr-only"> (terminé)</span>}
              </span>
              {i < BOOKING_STEPS.length - 1 && <span aria-hidden="true" className={cn("h-px flex-1", done ? "bg-petrol/40" : "bg-line")} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
