import { processSteps } from "@/data/cabinet";
import { cn } from "@/lib/cn";

/**
 * Parcours de soin en 4 étapes.
 * - variant "compact" : frise horizontale (accueil)
 * - variant "detailed" : frise verticale avec explications (page Déroulement)
 */
export function ProcessSteps({ variant = "compact" }: { variant?: "compact" | "detailed" }) {
  if (variant === "compact") {
    return (
      <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {processSteps.map((step, i) => (
          <li key={step.title} className="relative">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-petrol/25 bg-surface text-small font-semibold tabular-nums text-petrol">
                {String(i + 1).padStart(2, "0")}
              </span>
              {i < processSteps.length - 1 && (
                <span aria-hidden="true" className="hidden h-px flex-1 bg-gradient-to-r from-petrol/30 to-transparent lg:block" />
              )}
            </div>
            <h3 className="mt-5 text-h3">{step.title}</h3>
            <p className="mt-2 text-small text-muted">{step.summary}</p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="relative">
      {processSteps.map((step, i) => {
        const last = i === processSteps.length - 1;
        return (
          <li key={step.title} className="reveal relative grid grid-cols-[3.25rem_1fr] gap-x-5 sm:grid-cols-[4.5rem_1fr] sm:gap-x-8">
            <div className="relative flex justify-center">
              <span className="relative z-10 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-petrol text-[1.0625rem] font-semibold tabular-nums text-white shadow-lift sm:h-[4.5rem] sm:w-[4.5rem] sm:text-[1.375rem]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {!last && <span aria-hidden="true" className="absolute bottom-0 top-[3.25rem] w-px bg-petrol/20 sm:top-[4.5rem]" />}
            </div>
            <div className={cn("pt-2 sm:pt-4", last ? "pb-0" : "pb-12 sm:pb-16")}>
              <h2 className="text-[1.5rem] leading-tight sm:text-[1.75rem]">{step.title}</h2>
              <p className="mt-2 font-medium text-sage-deep">{step.summary}</p>
              <p className="mt-4 max-w-prose text-muted">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
