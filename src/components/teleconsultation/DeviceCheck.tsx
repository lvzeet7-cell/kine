"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export type DeviceStatus = "idle" | "testing" | "ok" | "denied" | "missing" | "busy" | "unsupported" | "error";

const MESSAGES: Record<Exclude<DeviceStatus, "idle" | "testing" | "ok">, string> = {
  denied:
    "L'accès à la caméra ou au micro a été refusé. Cliquez sur l'icône de cadenas (ou de caméra) dans la barre d'adresse, autorisez la caméra et le micro, puis relancez le test.",
  missing: "Aucune caméra ou aucun micro n'a été détecté. Branchez un casque ou une webcam, puis relancez le test.",
  busy: "La caméra ou le micro est déjà utilisé par une autre application (visio, appel…). Fermez-la, puis relancez le test.",
  unsupported:
    "Ce navigateur ne permet pas la vidéo. Utilisez une version récente de Chrome, Safari, Edge ou Firefox (sur smartphone : Safari sur iPhone, Chrome sur Android).",
  error: "Le test n'a pas pu être lancé. Rechargez la page et réessayez.",
};

function classify(e: unknown): DeviceStatus {
  const name = (e as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "missing";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "error";
}

/**
 * Test de la caméra et du micro avant d'entrer : aperçu vidéo + niveau sonore.
 * Le flux est arrêté dès que l'on quitte le test (aucun enregistrement).
 */
export function DeviceCheck({ onStatus }: { onStatus?: (s: DeviceStatus) => void }) {
  const [status, setStatus] = useState<DeviceStatus>("idle");
  const [level, setLevel] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);

  const update = useCallback(
    (s: DeviceStatus) => {
      setStatus(s);
      onStatus?.(s);
    },
    [onStatus],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => stop, [stop]);

  async function start() {
    stop();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return update("unsupported");
    update("testing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setHasVideo(stream.getVideoTracks().length > 0);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      // Niveau du micro
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx && stream.getAudioTracks().length > 0) {
        const ctx = new Ctx();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const loop = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) sum += ((v - 128) / 128) ** 2;
          setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      }
      update("ok");
    } catch (e) {
      update(classify(e));
    }
  }

  const problem = status !== "idle" && status !== "testing" && status !== "ok" ? MESSAGES[status] : null;

  return (
    <div className="rounded-panel border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[1.0625rem] font-semibold">Tester ma caméra et mon micro</h3>
        {status === "ok" && (
          <span className="inline-flex items-center gap-1.5 text-small font-medium text-success" role="status">
            <Icon name="check" size={16} /> Tout fonctionne
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-end">
        <div className="relative aspect-video overflow-hidden rounded-card bg-petrol-deep">
          <video ref={videoRef} muted playsInline autoPlay className={`h-full w-full -scale-x-100 object-cover ${hasVideo && status === "ok" ? "" : "invisible"}`} />
          {!(hasVideo && status === "ok") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
              <Icon name="video" size={30} />
              <span className="text-small">{status === "testing" ? "Autorisez la caméra et le micro…" : "Aperçu de votre caméra"}</span>
            </div>
          )}
        </div>
        <div>
          <p className="flex items-center gap-2 text-small text-muted">
            <Icon name="mic" size={16} /> Micro
          </p>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-mist"
            role="meter"
            aria-label="Niveau du micro"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(level * 100)}
          >
            <div className="h-full rounded-full bg-sage-deep transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
          <p className="mt-2 text-micro text-muted">Parlez : la barre doit bouger.</p>
        </div>
      </div>

      {problem && (
        <p role="alert" className="mt-4 flex gap-2 rounded-card bg-warning-soft p-3 text-small text-ink">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-warning" />
          {problem}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={start} disabled={status === "testing"}>
          {status === "idle" ? "Lancer le test" : "Relancer le test"}
        </Button>
        {status === "ok" && (
          <Button variant="secondary" onClick={() => { stop(); update("idle"); setHasVideo(false); }}>
            Arrêter le test
          </Button>
        )}
      </div>
    </div>
  );
}
