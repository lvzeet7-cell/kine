"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { api } from "@/components/booking/hooks";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { DeviceCheck } from "./DeviceCheck";
import type { DailyCall, DailyEvent, DailyFactory, DailyParticipant } from "./daily-types";

type Phase = "prejoin" | "joining" | "waiting" | "in-call" | "left" | "ended" | "error";
type Quality = "good" | "low" | "very-low";

type JoinOk = { roomUrl: string; token: string; expiresAt: string };

export type TeleRoomProps = {
  /** API qui vérifie l'accès côté serveur et renvoie un jeton temporaire */
  joinEndpoint: string;
  joinBody?: Record<string, unknown>;
  role: "patient" | "practitioner";
  /** Nom affiché pour l'autre participant (dans l'interface uniquement) */
  remoteLabel: string;
  /** Texte de l'écran d'attente */
  waitingText: string;
  /** Jeton du lien patient (pour « Signaler un problème ») */
  reportToken?: string;
};

const QUALITY: Record<Quality, { label: string; bars: number; tone: string }> = {
  good: { label: "Connexion bonne", bars: 3, tone: "text-success" },
  low: { label: "Connexion moyenne", bars: 2, tone: "text-warning" },
  "very-low": { label: "Connexion faible", bars: 1, tone: "text-danger" },
};

function remoteOf(call: DailyCall): DailyParticipant | null {
  return Object.values(call.participants()).find((p) => !p.local) ?? null;
}

function useTrack(el: RefObject<HTMLVideoElement | HTMLAudioElement | null>, track: MediaStreamTrack | null | undefined) {
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (!track) {
      node.srcObject = null;
      return;
    }
    const current = node.srcObject as MediaStream | null;
    if (current?.getTracks()[0]?.id === track.id) return;
    node.srcObject = new MediaStream([track]);
    node.play?.().catch(() => {});
  }, [el, track]);
}

function SignalBars({ quality }: { quality: Quality }) {
  const q = QUALITY[quality];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-micro font-medium text-white backdrop-blur" role="status" aria-live="polite">
      <span aria-hidden="true" className={cn("flex items-end gap-[2px]", q.tone)}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-sm", i <= q.bars ? "bg-current" : "bg-white/30")} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      {q.label}
    </span>
  );
}

function ControlButton({ on, onClick, labelOn, labelOff, iconOn, iconOff, danger }: {
  on: boolean;
  onClick: () => void;
  labelOn: string;
  labelOff: string;
  iconOn: "mic" | "video" | "hangup";
  iconOff: "micOff" | "videoOff" | "hangup";
  danger?: boolean;
}) {
  const label = on ? labelOn : labelOff;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={danger ? undefined : !on}
      title={label}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-12 sm:w-12",
        danger ? "bg-danger text-white hover:brightness-110" : on ? "bg-white/15 text-white hover:bg-white/25" : "bg-white text-petrol-deep",
      )}
    >
      <Icon name={on ? iconOn : iconOff} size={22} />
    </button>
  );
}

function ReportIssue({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function send() {
    setState("sending");
    const r = await api<{ ok?: boolean; message?: string }>("/api/teleconsultation/report", { method: "POST", body: JSON.stringify({ token, text }) });
    if (r.ok) {
      setState("sent");
      setText("");
    } else {
      setState("error");
      setMsg(String(r.data?.message ?? "Le signalement n'a pas pu être envoyé."));
    }
  }

  if (!open)
    return (
      <button type="button" className="link text-small" onClick={() => setOpen(true)}>
        Signaler un problème technique
      </button>
    );
  return (
    <div className="w-full rounded-card border border-line bg-surface p-4 text-left">
      <label htmlFor="tele-issue" className="text-small font-semibold">
        Quel problème rencontrez-vous ?
      </label>
      <p className="mt-1 text-micro text-muted">Uniquement technique (son, image, connexion). N&apos;indiquez pas d&apos;informations médicales.</p>
      <textarea
        id="tele-issue"
        maxLength={500}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-2 w-full rounded-control border border-line bg-paper p-3 text-small"
      />
      {state === "sent" && (
        <p role="status" className="mt-2 text-small text-success">
          Merci, le cabinet a été prévenu.
        </p>
      )}
      {state === "error" && (
        <p role="alert" className="mt-2 text-small text-danger">
          {msg}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={send} disabled={state === "sending" || text.trim().length < 3}>
          {state === "sending" ? "Envoi…" : "Envoyer"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </div>
    </div>
  );
}

/**
 * Salle de téléconsultation (patient ou praticien).
 * - test caméra/micro avant d'entrer ;
 * - accès obtenu auprès du serveur (jeton temporaire, propre au rôle) ;
 * - vidéo de l'autre participant + aperçu de sa propre caméra, micro/caméra, quitter ;
 * - indicateur de connexion, écran d'attente, écran de fin, reconnexion.
 * Aucun enregistrement n'est déclenché.
 */
export function TeleRoom({ joinEndpoint, joinBody, role, remoteLabel, waitingText, reportToken }: TeleRoomProps) {
  const [phase, setPhase] = useState<Phase>("prejoin");
  const [error, setError] = useState<string | null>(null);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [quality, setQuality] = useState<Quality>("good");
  const [interrupted, setInterrupted] = useState(false);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [remote, setRemote] = useState<DailyParticipant | null>(null);
  const [local, setLocal] = useState<DailyParticipant | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const endedRef = useRef(false);

  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const localVideo = useRef<HTMLVideoElement>(null);

  const remoteVideoTrack = remote?.tracks.video.state === "playable" ? remote.tracks.video.persistentTrack : null;
  const remoteAudioTrack = remote?.tracks.audio.state === "playable" ? remote.tracks.audio.persistentTrack : null;
  const localVideoTrack = local?.tracks.video.state === "playable" || local?.tracks.video.state === "sendable" ? local.tracks.video.persistentTrack : null;
  useTrack(remoteVideo, remoteVideoTrack);
  useTrack(remoteAudio, remoteAudioTrack);
  useTrack(localVideo, localVideoTrack);

  const teardown = useCallback(async () => {
    const call = callRef.current;
    callRef.current = null;
    if (!call) return;
    try {
      await call.leave();
    } catch {}
    try {
      await call.destroy();
    } catch {}
  }, []);

  useEffect(() => () => void teardown(), [teardown]);

  // Quitter proprement si l'onglet est fermé
  useEffect(() => {
    const h = () => void callRef.current?.leave();
    window.addEventListener("pagehide", h);
    return () => window.removeEventListener("pagehide", h);
  }, []);

  async function join() {
    setError(null);
    setMediaWarning(null);
    setInterrupted(false);
    endedRef.current = false;
    setPhase("joining");
    await teardown();

    const r = await api<JoinOk & { message?: string }>(joinEndpoint, { method: "POST", body: JSON.stringify(joinBody ?? {}) });
    if (!r.ok) {
      setError(String(r.data?.message ?? "L'accès à la salle a été refusé."));
      setPhase("error");
      return;
    }
    const { roomUrl, token } = r.data;

    let factory: DailyFactory;
    try {
      const mod = (await import("@daily-co/daily-js")) as unknown as { default: DailyFactory };
      factory = mod.default;
    } catch {
      setError("Le module vidéo n'a pas pu être chargé. Vérifiez votre connexion internet, puis réessayez.");
      setPhase("error");
      return;
    }

    // avoidEval : compatible avec la politique de sécurité du site (pas de 'unsafe-eval')
    const call = factory.createCallObject({ subscribeToTracksAutomatically: true, dailyConfig: { avoidEval: true } });
    callRef.current = call;

    const refresh = () => {
      if (callRef.current !== call) return;
      const ps = call.participants();
      setLocal(ps.local ?? null);
      const rem = remoteOf(call);
      setRemote(rem);
      setPhase((p) => (p === "waiting" || p === "in-call" ? (rem ? "in-call" : "waiting") : p));
    };
    const onJoined = () => {
      setPhase(remoteOf(call) ? "in-call" : "waiting");
      setMic(call.localAudio());
      setCam(call.localVideo());
      refresh();
    };
    const onLeft = () => {
      if (callRef.current !== call) return;
      if (!endedRef.current) setPhase("left");
    };
    const onEjected = () => {
      endedRef.current = true;
      setPhase("ended");
    };
    const onQuality = (e?: DailyEvent) => e?.threshold && setQuality(e.threshold);
    const onNetwork = (e?: DailyEvent) => setInterrupted(e?.event === "interrupted");
    const onCameraError = () =>
      setMediaWarning(
        "Votre caméra ou votre micro n'est pas accessible. Autorisez-les dans les réglages du navigateur (icône à gauche de l'adresse), puis cliquez sur « Rejoindre à nouveau ». Vous pouvez aussi continuer : l'autre participant ne vous verra ou ne vous entendra pas.",
      );
    const onError = (e?: DailyEvent) => {
      if (callRef.current !== call) return;
      const msg = e?.errorMsg ?? e?.error?.msg ?? "";
      if (/exp|eject|ended/i.test(msg)) {
        endedRef.current = true;
        setPhase("ended");
        return;
      }
      setError("La connexion à la salle a été interrompue.");
      setPhase("error");
    };

    call.on("joined-meeting", onJoined);
    for (const ev of ["participant-joined", "participant-updated", "participant-left", "track-started", "track-stopped"] as const) call.on(ev, refresh);
    call.on("left-meeting", onLeft);
    call.on("ejected", onEjected);
    call.on("network-quality-change", onQuality);
    call.on("network-connection", onNetwork);
    call.on("camera-error", onCameraError);
    call.on("error", onError);

    try {
      await call.join({ url: roomUrl, token });
      onJoined();
    } catch (e) {
      if (callRef.current !== call) return;
      const msg = (e as { errorMsg?: string; message?: string })?.errorMsg ?? (e as Error)?.message ?? "";
      setError(/exp/i.test(msg) ? "Votre accès a expiré. Rechargez la page." : "Impossible de rejoindre la salle. Vérifiez votre connexion internet, puis réessayez.");
      setPhase("error");
      await teardown();
    }
  }

  async function leave() {
    endedRef.current = false;
    await teardown();
    setRemote(null);
    setLocal(null);
    setPhase("left");
  }

  function toggleMic() {
    const call = callRef.current;
    if (!call) return;
    call.setLocalAudio(!mic);
    setMic(!mic);
  }
  function toggleCam() {
    const call = callRef.current;
    if (!call) return;
    call.setLocalVideo(!cam);
    setCam(!cam);
  }

  /* --------- Écrans hors appel --------- */
  if (phase === "prejoin" || phase === "joining") {
    return (
      <div className="space-y-5" data-tele-phase={phase}>
        <DeviceCheck />
        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={join} disabled={phase === "joining"}>
            <Icon name="video" size={20} />
            {phase === "joining" ? "Connexion…" : role === "patient" ? "Rejoindre la téléconsultation" : "Ouvrir la salle"}
          </Button>
          <p className="text-small text-muted">Le test est facultatif mais recommandé.</p>
        </div>
      </div>
    );
  }

  if (phase === "left" || phase === "ended" || phase === "error") {
    const ended = phase === "ended";
    return (
      <div className="rounded-panel border border-line bg-surface p-6 text-center sm:p-10" data-tele-phase={phase}>
        <span className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full", phase === "error" ? "bg-danger/10 text-danger" : "bg-sage-soft text-sage-deep")}>
          <Icon name={phase === "error" ? "alert" : "check"} size={26} />
        </span>
        <h2 className="mt-4 text-[1.375rem] font-semibold">
          {phase === "error" ? "Connexion impossible" : ended ? "La téléconsultation est terminée" : "Vous avez quitté la salle"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-small text-muted" role={phase === "error" ? "alert" : undefined}>
          {phase === "error"
            ? error
            : ended
              ? "La salle a été fermée. Merci, et à bientôt."
              : "Si c'était une erreur, vous pouvez revenir dans la salle tant que la séance n'est pas terminée."}
        </p>
        <div className="mt-6 flex flex-col items-center gap-4">
          {!ended && (
            <Button onClick={join}>
              <Icon name="refresh" size={18} />
              Rejoindre à nouveau
            </Button>
          )}
          {role === "patient" && reportToken && <ReportIssue token={reportToken} />}
        </div>
      </div>
    );
  }

  /* --------- Dans la salle --------- */
  const waiting = phase === "waiting";
  return (
    <div className="space-y-4" data-tele-phase={phase}>
      <div className="relative overflow-hidden rounded-panel bg-[#0d1d22] text-white">
        <div className="relative aspect-[3/4] w-full sm:aspect-video">
          {/* Vidéo principale : l'autre participant */}
          <video ref={remoteVideo} autoPlay playsInline className={cn("absolute inset-0 h-full w-full object-cover", !remoteVideoTrack && "invisible")} aria-label={`Vidéo de ${remoteLabel}`} />
          <audio ref={remoteAudio} autoPlay />
          {(waiting || !remoteVideoTrack) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              {waiting ? (
                <>
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/10 motion-reduce:animate-none" />
                    <Icon name="clock" size={24} />
                  </span>
                  <p className="text-[1.125rem] font-semibold" role="status">
                    Salle d&apos;attente
                  </p>
                  <p className="max-w-sm text-small text-white/70">{waitingText}</p>
                </>
              ) : (
                <>
                  <Icon name="videoOff" size={28} />
                  <p className="text-small text-white/70">{remoteLabel} a désactivé sa caméra</p>
                </>
              )}
            </div>
          )}

          {/* Indicateurs */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <SignalBars quality={quality} />
            {!waiting && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-micro font-medium backdrop-blur">
                {remoteLabel}
                {remote && remote.tracks.audio.state !== "playable" && <Icon name="micOff" size={13} />}
              </span>
            )}
          </div>

          {/* Aperçu de sa propre caméra */}
          <div className="absolute bottom-3 right-3 aspect-[3/4] w-24 overflow-hidden rounded-card border border-white/20 bg-black/60 shadow-lift sm:aspect-video sm:w-44">
            <video ref={localVideo} autoPlay muted playsInline className={cn("h-full w-full -scale-x-100 object-cover", (!cam || !localVideoTrack) && "invisible")} aria-label="Votre caméra" />
            {(!cam || !localVideoTrack) && (
              <div className="absolute inset-0 flex items-center justify-center text-white/60">
                <Icon name="videoOff" size={20} />
              </div>
            )}
            <span className="absolute bottom-1 left-1.5 text-[0.625rem] font-medium text-white/80">Vous</span>
          </div>

          {interrupted && (
            <div role="alert" className="absolute inset-x-3 top-14 flex items-center justify-center gap-2 rounded-card bg-warning px-4 py-3 text-small font-medium text-white sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
              <Icon name="signal" size={18} />
              Connexion interrompue — reconnexion en cours…
            </div>
          )}
        </div>

        {/* Commandes */}
        <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-black/30 px-4 py-3 sm:gap-4">
          <ControlButton on={mic} onClick={toggleMic} labelOn="Couper le micro" labelOff="Activer le micro" iconOn="mic" iconOff="micOff" />
          <ControlButton on={cam} onClick={toggleCam} labelOn="Couper la caméra" labelOff="Activer la caméra" iconOn="video" iconOff="videoOff" />
          <ControlButton on onClick={leave} labelOn="Quitter la téléconsultation" labelOff="Quitter la téléconsultation" iconOn="hangup" iconOff="hangup" danger />
        </div>
      </div>

      {mediaWarning && (
        <p role="alert" className="flex gap-2 rounded-card bg-warning-soft p-3 text-small text-ink">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-warning" />
          {mediaWarning}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-micro text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="shield" size={14} /> Échange chiffré, sans enregistrement.
        </span>
        {role === "patient" && reportToken && <ReportIssue token={reportToken} />}
      </div>
    </div>
  );
}
