"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { api } from "./hooks";

/**
 * « Modifier ou annuler » : le patient saisit son adresse e-mail et reçoit
 * un nouveau lien de gestion pour ses rendez-vous à venir.
 */
export function ManageLinkRequest() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const startedAt = useRef(0);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Vérifiez l'adresse e-mail, par exemple : prenom.nom@exemple.fr");
      return;
    }
    setSending(true);
    const r = await api<{ message: string }>("/api/booking/manage/request", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), website, startedAt: startedAt.current }),
    });
    setSending(false);
    if (r.ok) setDone(r.data.message);
    else {
      const errs = r.data.errors as Record<string, string> | undefined;
      setError(errs?.email ?? String(r.data.message));
    }
  }

  if (done) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="flex gap-3 rounded-card bg-sage-soft p-5 text-small text-ink outline-none">
        <Icon name="mail" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
        <div>
          <p className="font-semibold">Demande envoyée</p>
          <p className="mt-1">{done}</p>
          <button type="button" onClick={() => { setDone(null); setEmail(""); }} className="link mt-3 text-small">
            Faire une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative">
      <label htmlFor="manage-email" className="mb-2 block text-small font-semibold text-ink">
        Adresse e-mail utilisée pour la réservation
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="manage-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "manage-email-error" : undefined}
          placeholder="prenom.nom@exemple.fr"
          className="field flex-1"
        />
        <Button type="submit" disabled={sending} className="shrink-0">
          {sending ? "Envoi…" : "Recevoir le lien"}
        </Button>
      </div>
      {error && (
        <p id="manage-email-error" role="alert" className="mt-2 text-small text-danger">
          {error}
        </p>
      )}

      {/* Champ piège anti-robots, invisible pour les personnes */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="manage-website">Ne pas remplir ce champ</label>
        <input id="manage-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
    </form>
  );
}
