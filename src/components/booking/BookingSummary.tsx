import type { ReactNode } from "react";

/** Récapitulatif sous forme de liste de définitions */
export function SummaryList({ rows }: { rows: { label: string; value: ReactNode; action?: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line rounded-card border border-line bg-surface">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[6.5rem_1fr_auto] items-baseline gap-3 px-5 py-4 sm:grid-cols-[8rem_1fr_auto]">
          <dt className="text-small text-muted">{r.label}</dt>
          <dd className="min-w-0 break-words font-semibold text-ink">{r.value}</dd>
          <dd className="text-small">{r.action}</dd>
        </div>
      ))}
    </dl>
  );
}
