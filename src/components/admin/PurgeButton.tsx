"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminApi, Notice } from "./shared";

export function PurgeButton({ days }: { days: number }) {
  const [ask, setAsk] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const run = async () => {
    const r = await adminApi<{ deleted: number }>("/api/admin/purge", { method: "POST" });
    setAsk(false);
    setResult(r.ok ? `${r.data.deleted} rendez-vous de plus de ${days} jours supprimé(s).` : String(r.data.message));
  };
  return (
    <div className="space-y-3">
      {ask ? (
        <div className="flex flex-wrap items-center gap-2 text-small">
          <span>Supprimer définitivement les rendez-vous de plus de {days} jours ?</span>
          <Button size="sm" onClick={run} className="bg-danger hover:bg-danger/90">Supprimer</Button>
          <Button size="sm" variant="ghost" onClick={() => setAsk(false)}>Non</Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setAsk(true)}>Purger maintenant</Button>
      )}
      {result && <Notice tone="ok">{result}</Notice>}
    </div>
  );
}
