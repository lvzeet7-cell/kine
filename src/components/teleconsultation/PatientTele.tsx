"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/booking/hooks";
import { Icon } from "@/components/ui/Icon";
import { DeviceCheck } from "./DeviceCheck";
import { TeleRoom } from "./TeleRoom";

export type PatientTeleState = "upcoming" | "open" | "expired" | "cancelled" | "ended";

type Props = {
  token: string;
  initialState: PatientTeleState;
  opensAt: string;
  opensAtLabel: string;
  configured: boolean;
  practitionerName: string;
  phone: string | null;
};

const CLOSED: Record<"expired" | "cancelled" | "ended", { title: string; text: string; icon: "clock" | "close" | "check" }> = {
  cancelled: { title: "Ce rendez-vous a été annulé", text: "La salle vidéo n'est plus accessible. Vous pouvez reprendre rendez-vous en ligne.", icon: "close" },
  ended: { title: "Cette téléconsultation est terminée", text: "Merci. Si besoin, vous pouvez reprendre rendez-vous en ligne.", icon: "check" },
  expired: { title: "Ce lien a expiré", text: "L'horaire de la téléconsultation est dépassé : la salle n'est plus accessible.", icon: "clock" },
};

/** Page patient : états « à venir », « salle ouverte », « annulée », « terminée », « expirée » */
export function PatientTele({ token, initialState, opensAt, opensAtLabel, configured, practitionerName, phone }: Props) {
  const [state, setState] = useState<PatientTeleState>(initialState);

  // Avant l'ouverture : on vérifie régulièrement l'état auprès du serveur (source de vérité)
  useEffect(() => {
    if (state !== "upcoming") return;
    const check = async () => {
      const r = await api<{ state: PatientTeleState }>(`/api/teleconsultation/state?token=${encodeURIComponent(token)}`);
      if (r.ok) setState(r.data.state);
    };
    const ms = Math.max(5_000, Math.min(60_000, Date.parse(opensAt) - Date.now()));
    const id = window.setInterval(check, ms);
    return () => window.clearInterval(id);
  }, [state, token, opensAt]);

  if (state === "cancelled" || state === "ended" || state === "expired") {
    const c = CLOSED[state];
    return (
      <div className="rounded-panel border border-line bg-surface p-6 text-center sm:p-10" data-tele-state={state}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mist text-ink">
          <Icon name={c.icon} size={24} />
        </span>
        <h2 className="mt-4 text-[1.375rem] font-semibold">{c.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-small text-muted">{c.text}</p>
        <a href="/rendez-vous" className="link mt-5 inline-block text-small font-medium">
          Prendre rendez-vous
        </a>
      </div>
    );
  }

  if (!configured) {
    return (
      <div role="alert" className="rounded-panel border border-warning/40 bg-warning-soft p-6" data-tele-state="not-configured">
        <p className="font-semibold">La visioconférence n&apos;est pas encore disponible sur le site.</p>
        <p className="mt-2 text-small text-ink">
          Merci de contacter le cabinet{phone ? ` au ${phone}` : ""} pour convenir de la suite de votre rendez-vous.
        </p>
      </div>
    );
  }

  if (state === "upcoming") {
    return (
      <div className="space-y-5" data-tele-state="upcoming">
        <div className="flex items-start gap-3 rounded-panel bg-petrol-soft p-5 sm:p-6" role="status">
          <Icon name="clock" size={22} className="mt-0.5 shrink-0 text-petrol" />
          <div>
            <p className="font-semibold">La salle ouvrira {opensAtLabel}.</p>
            <p className="mt-1 text-small text-muted">
              Gardez cette page ouverte : le bouton pour rejoindre apparaîtra automatiquement. En attendant, vous pouvez tester votre caméra et votre micro.
            </p>
          </div>
        </div>
        <DeviceCheck />
      </div>
    );
  }

  return (
    <div data-tele-state="open">
      <TeleRoom
        joinEndpoint="/api/teleconsultation/join"
        joinBody={{ token }}
        role="patient"
        remoteLabel={practitionerName}
        waitingText={`Vous êtes bien dans la salle. ${practitionerName} va vous rejoindre à l'heure du rendez-vous.`}
        reportToken={token}
      />
    </div>
  );
}
