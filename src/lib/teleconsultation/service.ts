/**
 * Téléconsultation — règles métier (serveur uniquement).
 *
 * Accès :
 * - patient : uniquement avec le jeton secret de son lien personnel (le même que pour gérer le rendez-vous),
 *   dans une fenêtre horaire autour du rendez-vous ;
 * - praticien : uniquement avec une session admin valide.
 * La salle vidéo est PRIVÉE : chacun reçoit un jeton du fournisseur, propre à la salle, au rôle et limité dans le temps.
 * Connaître l'identifiant ou l'adresse de la salle ne suffit pas pour entrer.
 */
import type { BookingRepository } from "@/lib/booking/repository";
import { randomToken } from "@/lib/booking/tokens";
import type { Appointment, Teleconsultation } from "@/lib/booking/types";
import type { VideoProvider } from "@/lib/video/provider";
import { isTeleAppointment } from "./kind";
import { getTeleSettings } from "./settings";

const MIN = 60_000;

export const teleConfig = {
  /** Le patient peut rejoindre la salle à partir de N minutes avant le début */
  patientOpensBeforeMin: 15,
  /** … et jusqu'à N minutes après la fin prévue (ensuite le lien est expiré) */
  patientClosesAfterMin: 30,
  /** Le praticien peut ouvrir la salle plus tôt, et plus tard */
  practitionerOpensBeforeMin: 60,
  practitionerClosesAfterMin: 120,
  /** Expiration de la salle chez le fournisseur, après la fin prévue */
  roomExpiresAfterMin: 150,
  /** Nom affiché au fournisseur pour le patient : aucune donnée personnelle */
  patientDisplayName: "Patient",
  /** Longueur max d'un signalement de problème technique */
  issueMaxLength: 500,
};

export type TeleState = "upcoming" | "open" | "expired" | "cancelled" | "ended";

export { isTeleAppointment };

/** État vu par le patient */
export function patientState(a: Appointment, now = new Date()): TeleState {
  if (a.status === "CANCELLED") return "cancelled";
  if (a.status === "COMPLETED" || a.status === "NO_SHOW") return "ended";
  const t = now.getTime();
  if (t > Date.parse(a.endAt) + teleConfig.patientClosesAfterMin * MIN) return "expired";
  if (t < Date.parse(a.startAt) - teleConfig.patientOpensBeforeMin * MIN) return "upcoming";
  return "open";
}

/** Heure à partir de laquelle le patient peut rejoindre */
export const patientOpensAt = (a: Appointment) => new Date(Date.parse(a.startAt) - teleConfig.patientOpensBeforeMin * MIN).toISOString();

function practitionerWindowOk(a: Appointment, now: Date) {
  const t = now.getTime();
  return (
    t >= Date.parse(a.startAt) - teleConfig.practitionerOpensBeforeMin * MIN &&
    t <= Date.parse(a.endAt) + teleConfig.practitionerClosesAfterMin * MIN
  );
}

const nowIso = () => new Date().toISOString();

function blank(appointmentId: string, provider: string, priceCents: number | null): Teleconsultation {
  const now = nowIso();
  return {
    appointmentId,
    provider,
    roomName: null,
    roomUrl: null,
    priceCents,
    patientJoinedAt: null,
    practitionerJoinedAt: null,
    issueReport: null,
    issueAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * À la réservation : crée la fiche (tarif figé au moment de la réservation) et, si possible, la salle vidéo.
 * Un échec chez le fournisseur ne bloque pas la réservation : la salle sera créée à la première connexion.
 */
export async function prepareTeleconsultation(repo: BookingRepository, provider: VideoProvider | null, a: Appointment) {
  if (!isTeleAppointment(a)) return null;
  let t = await repo.getTeleconsultation(a.id);
  if (!t) {
    const settings = await getTeleSettings(repo);
    t = blank(a.id, provider?.id ?? "none", settings.priceCents);
    await repo.saveTeleconsultation(t);
  }
  if (provider) {
    try {
      t = await ensureRoom(repo, provider, a, t);
    } catch (e) {
      console.error("[téléconsultation] Création de salle différée :", (e as Error).message);
    }
  }
  return t;
}

async function ensureRoom(repo: BookingRepository, provider: VideoProvider, a: Appointment, current?: Teleconsultation, forceNew = false) {
  const t = current ?? (await repo.getTeleconsultation(a.id)) ?? blank(a.id, provider.id, (await getTeleSettings(repo)).priceCents);
  if (!forceNew && t.roomName && t.roomUrl && t.provider === provider.id) return t;
  // Nom aléatoire et imprévisible : aucune information sur le patient ou le rendez-vous
  const room = await provider.createRoom({
    name: `lp-${randomToken(15)}`,
    expiresAt: new Date(Date.parse(a.endAt) + teleConfig.roomExpiresAfterMin * MIN),
  });
  const next: Teleconsultation = { ...t, provider: provider.id, roomName: room.name, roomUrl: room.url, updatedAt: nowIso() };
  await repo.saveTeleconsultation(next);
  return next;
}

/**
 * Révoque la salle (annulation, report, fin) : elle est supprimée chez le fournisseur ;
 * en cas de report, une nouvelle salle est créée à la prochaine connexion.
 */
export async function revokeRoom(repo: BookingRepository, provider: VideoProvider | null, appointmentId: string) {
  const t = await repo.getTeleconsultation(appointmentId);
  if (!t?.roomName) return;
  if (provider && t.provider === provider.id) {
    try {
      await provider.deleteRoom(t.roomName);
    } catch (e) {
      console.error("[téléconsultation] Suppression de salle impossible :", (e as Error).message);
    }
  }
  await repo.saveTeleconsultation({ ...t, roomName: null, roomUrl: null, updatedAt: nowIso() });
}

/**
 * Jeton d'accès à la salle. Si la salle n'existe plus chez le fournisseur (supprimée ou expirée de son côté),
 * une nouvelle salle privée est créée et l'opération est retentée une fois.
 */
async function issueToken(
  repo: BookingRepository,
  provider: VideoProvider,
  a: Appointment,
  opts: { isOwner: boolean; userName: string; expiresAt: Date },
) {
  let t = await ensureRoom(repo, provider, a);
  if (!(await provider.roomExists(t.roomName as string))) t = await ensureRoom(repo, provider, a, t, true);
  try {
    return { t, token: await provider.createToken({ roomName: t.roomName as string, ...opts }) };
  } catch (e) {
    console.error("[téléconsultation] Jeton refusé, nouvelle salle :", (e as Error).message);
    t = await ensureRoom(repo, provider, a, t, true);
    return { t, token: await provider.createToken({ roomName: t.roomName as string, ...opts }) };
  }
}

export type JoinFailure = {
  ok: false;
  code: "not_tele" | "cancelled" | "ended" | "expired" | "too_early" | "not_configured" | "provider_error";
  message: string;
  opensAt?: string;
};
export type JoinSuccess = { ok: true; roomUrl: string; token: string; expiresAt: string };

const FAILURES: Record<JoinFailure["code"], string> = {
  not_tele: "Ce rendez-vous n'est pas une téléconsultation.",
  cancelled: "Ce rendez-vous a été annulé.",
  ended: "Cette téléconsultation est terminée.",
  expired: "Ce lien a expiré : l'horaire de la téléconsultation est dépassé.",
  too_early: "La salle n'est pas encore ouverte.",
  not_configured: "La visioconférence n'est pas encore configurée sur le site. Merci d'appeler le cabinet.",
  provider_error: "La salle vidéo n'a pas pu être préparée. Réessayez dans un instant ou appelez le cabinet.",
};
const fail = (code: JoinFailure["code"], extra: Partial<JoinFailure> = {}): JoinFailure => ({ ok: false, code, message: FAILURES[code], ...extra });

/** Accès patient : contrôle de l'état, de la fenêtre horaire, puis jeton temporaire non propriétaire */
export async function joinAsPatient(repo: BookingRepository, provider: VideoProvider | null, a: Appointment, now = new Date()): Promise<JoinFailure | JoinSuccess> {
  if (!isTeleAppointment(a)) return fail("not_tele");
  const state = patientState(a, now);
  if (state === "cancelled") return fail("cancelled");
  if (state === "ended") return fail("ended");
  if (state === "expired") return fail("expired");
  if (state === "upcoming") return fail("too_early", { opensAt: patientOpensAt(a) });
  if (!provider) return fail("not_configured");
  try {
    const expiresAt = new Date(Date.parse(a.endAt) + teleConfig.patientClosesAfterMin * MIN);
    const { t, token } = await issueToken(repo, provider, a, { isOwner: false, userName: teleConfig.patientDisplayName, expiresAt });
    if (!t.patientJoinedAt) {
      await repo.saveTeleconsultation({ ...t, patientJoinedAt: now.toISOString(), updatedAt: nowIso() });
      await repo.addNotification("TELE_JOINED", a.id, `Téléconsultation : ${a.firstName} ${a.lastName} est dans la salle d'attente.`);
    }
    return { ok: true, roomUrl: t.roomUrl as string, token, expiresAt: expiresAt.toISOString() };
  } catch (e) {
    console.error("[téléconsultation] Accès patient :", (e as Error).message);
    return fail("provider_error");
  }
}

/** Accès praticien (session admin vérifiée par l'appelant) : jeton propriétaire de la salle */
export async function joinAsPractitioner(
  repo: BookingRepository,
  provider: VideoProvider | null,
  a: Appointment,
  practitionerName: string,
  now = new Date(),
): Promise<JoinFailure | JoinSuccess> {
  if (!isTeleAppointment(a)) return fail("not_tele");
  if (a.status === "CANCELLED") return fail("cancelled");
  if (!practitionerWindowOk(a, now)) {
    return Date.parse(a.startAt) > now.getTime()
      ? fail("too_early", { opensAt: new Date(Date.parse(a.startAt) - teleConfig.practitionerOpensBeforeMin * MIN).toISOString() })
      : fail("expired");
  }
  if (!provider) return fail("not_configured");
  try {
    const expiresAt = new Date(Date.parse(a.endAt) + teleConfig.practitionerClosesAfterMin * MIN);
    const { t, token } = await issueToken(repo, provider, a, { isOwner: true, userName: practitionerName, expiresAt });
    if (!t.practitionerJoinedAt) await repo.saveTeleconsultation({ ...t, practitionerJoinedAt: now.toISOString(), updatedAt: nowIso() });
    return { ok: true, roomUrl: t.roomUrl as string, token, expiresAt: expiresAt.toISOString() };
  } catch (e) {
    console.error("[téléconsultation] Accès praticien :", (e as Error).message);
    return fail("provider_error");
  }
}

/** Signalement d'un problème technique par le patient (texte court, nettoyé ; aucune donnée médicale demandée) */
export async function reportIssue(repo: BookingRepository, a: Appointment, raw: unknown) {
  if (!isTeleAppointment(a)) return { ok: false as const, message: FAILURES.not_tele };
  const text = (typeof raw === "string" ? raw : "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, teleConfig.issueMaxLength);
  if (text.length < 3) return { ok: false as const, message: "Décrivez le problème en quelques mots." };
  const t = (await repo.getTeleconsultation(a.id)) ?? blank(a.id, "none", null);
  const at = nowIso();
  await repo.saveTeleconsultation({ ...t, issueReport: text, issueAt: at, updatedAt: at });
  await repo.addNotification("TELE_ISSUE", a.id, `Problème technique signalé (téléconsultation de ${a.firstName} ${a.lastName}).`);
  return { ok: true as const };
}
