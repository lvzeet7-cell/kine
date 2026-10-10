import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/data/site";
import { bookingConfig } from "@/lib/booking/config";
import { getRepo } from "@/lib/booking/server";
import { formatLongDate, formatTime } from "@/lib/booking/time";
import { STATUS_LABELS } from "@/lib/booking/types";
import { isTeleAppointment } from "@/lib/teleconsultation/service";
import { formatPrice } from "@/lib/teleconsultation/settings";
import { videoConfigured } from "@/lib/video";
import { AdminPageHeader, Notice } from "@/components/admin/shared";
import { TeleRoom } from "@/components/teleconsultation/TeleRoom";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Salle de téléconsultation", referrer: "no-referrer" as const };
export const dynamic = "force-dynamic";

const TZ = bookingConfig.timezone;

/** Salle côté praticien (la session admin est vérifiée par le layout ET par l'API d'accès) */
export default async function AdminTeleRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getRepo();
  const a = await repo.getAppointment(id);
  if (!a || !isTeleAppointment(a)) notFound();
  const t = await repo.getTeleconsultation(id);
  const active = a.status === "PENDING" || a.status === "CONFIRMED";
  const name = `${a.firstName} ${a.lastName}`;

  return (
    <div>
      <Link href="/admin/teleconsultations" className="link inline-flex items-center gap-1 text-small">
        <Icon name="chevronLeft" size={16} /> Téléconsultations
      </Link>
      <div className="mt-3">
        <AdminPageHeader
          title={`Téléconsultation — ${name}`}
          description={`${formatLongDate(a.startAt, TZ)} · ${formatTime(a.startAt, TZ)} – ${formatTime(a.endAt, TZ)} · ${STATUS_LABELS[a.status]}`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {!active ? (
            <Notice tone="info">Ce rendez-vous est « {STATUS_LABELS[a.status].toLowerCase()} » : la salle est fermée.</Notice>
          ) : !videoConfigured() ? (
            <Notice tone="error">La visioconférence n&apos;est pas configurée (DAILY_API_KEY manquante) : la salle ne peut pas être ouverte.</Notice>
          ) : (
            <TeleRoom
              joinEndpoint={`/api/admin/teleconsultations/${a.id}/join`}
              role="practitioner"
              remoteLabel={name}
              waitingText={`${a.firstName} n'est pas encore dans la salle. Le patient peut entrer 15 minutes avant l'horaire.`}
            />
          )}
        </div>
        <aside className="space-y-4 text-small">
          <dl className="divide-y divide-line rounded-card border border-line bg-surface">
            {[
              ["Patient", name],
              ["E-mail", a.email],
              ["Téléphone", a.phone],
              ["Durée", `${a.duration} min`],
              ["Tarif", formatPrice(t?.priceCents ?? null) ?? "Non communiqué"],
              ["Patient connecté", t?.patientJoinedAt ? new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, timeStyle: "short", dateStyle: "short" }).format(new Date(t.patientJoinedAt)) : "Pas encore"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-2 px-4 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="break-words font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {a.message && (
            <div className="rounded-card border border-line bg-surface p-4">
              <p className="text-micro font-semibold text-muted">Message du patient</p>
              <p className="mt-1 whitespace-pre-line">{a.message}</p>
            </div>
          )}
          {t?.issueReport && (
            <p className="flex gap-2 rounded-card bg-warning-soft p-3">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warning" />
              <span>Problème signalé : {t.issueReport}</span>
            </p>
          )}
          <p className="text-micro text-muted">
            Vous entrez sous le nom « {SITE.PRACTITIONER_NAME} ». Le patient apparaît au fournisseur vidéo sous le nom « Patient » uniquement. Aucun enregistrement.
          </p>
        </aside>
      </div>
    </div>
  );
}
