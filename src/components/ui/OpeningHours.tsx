import type { OpeningDay } from "@/data/site";
import { cn } from "@/lib/cn";
import { Value } from "./Value";

function formatSlot(slot: string) {
  return slot.replace("-", " – ").replace(/:/g, "h");
}

/**
 * Tableau des horaires d'ouverture.
 * Les horaires viennent de la base (getOpeningDays), chargés par la page ou le layout.
 */
export function OpeningHours({
  days,
  className,
  tone = "dark",
}: {
  days: OpeningDay[];
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <dl className={cn("divide-y", tone === "dark" ? "divide-line" : "divide-white/10", className)}>
      {days.map((d) => (
        <div key={d.day} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className={cn("text-small font-medium", tone === "dark" ? "text-ink" : "text-white")}>{d.day}</dt>
          <dd className={cn("text-right text-small tabular-nums", tone === "dark" ? "text-muted" : "text-white/75")}>
            {d.slots.length === 0 ? (
              "Fermé"
            ) : (
              d.slots.map((s, i) => (
                <span key={i} className="block">
                  {tone === "dark" ? <Value>{formatSlot(s)}</Value> : formatSlot(s)}
                </span>
              ))
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
