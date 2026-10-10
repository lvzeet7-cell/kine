"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/components/booking/hooks";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";
import { Icon } from "@/components/ui/Icon";

export function LoginForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Saisissez le mot de passe.");
      return;
    }
    setBusy(true);
    setError(null);
    const r = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
    setBusy(false);
    if (r.ok) {
      const next = new URLSearchParams(window.location.search).get("suite");
      window.location.href = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
      return;
    }
    setError(String(r.data.message));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={48} />
          <h1 className="mt-5 text-[1.5rem] font-semibold">Espace administrateur</h1>
          <p className="mt-1 text-small text-muted">Accès réservé au cabinet.</p>
        </div>

        {!configured ? (
          <div className="mt-8 rounded-card border border-line bg-surface p-5 text-small text-ink">
            <p className="font-semibold">Configuration requise</p>
            <p className="mt-2 text-muted">
              Définissez les variables <code>ADMIN_PASSWORD</code> (12 caractères minimum) et <code>SESSION_SECRET</code>{" "}
              (32 caractères minimum) dans le fichier <code>.env.local</code>, puis redémarrez le site.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-8 rounded-panel border border-line bg-surface p-6">
            <label htmlFor="admin-password" className="mb-2 block text-small font-semibold">
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "admin-password-error" : undefined}
              className="field"
            />
            {error && (
              <p id="admin-password-error" role="alert" className="mt-2 flex items-start gap-1.5 text-micro font-medium text-danger">
                <Icon name="alert" size={15} className="mt-px shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
              {busy ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
