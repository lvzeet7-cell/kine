import type { Metadata } from "next";
import Link from "next/link";
import { SITE, hasPhone, isSet } from "@/data/site";
import { bookingConfig } from "@/lib/booking/config";
import { getRepo } from "@/lib/booking/server";
import { findByToken } from "@/lib/booking/service";
import { formatLongDate, formatTime, localDate } from "@/lib/booking/time";
import { isTeleAppointment, patientOpensAt, patientState } from "@/lib/teleconsultation/service";
import { videoConfigured } from "@/lib/video";
import { PatientTele } from "@/components/teleconsultation/PatientTele";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ma téléconsultation",
  robots: { index: false, follow: false },
  // Le lien contient un jeton personnel : il ne doit pas être transmis aux autres sites
  referrer: "no-referrer",
};

const TZ = bookingConfig.timezone;

const INSTRUCTIONS = [
  "Installez-vous dans un endroit calme et bien éclairé, où vous pouvez parler librement.",
  "Portez une tenue confortable et prévoyez un peu d'espace pour bouger : des mouvements pourront vous être demandés.",
  "Utilisez de préférence un ordinateur ou une tablette posé(e), avec une connexion internet stable (Wi-Fi ou 4G/5G).",
  "Un casque ou des écouteurs améliorent le son et la confidentialité.",
  "Autorisez l'accès à la caméra et au micro lorsque le navigateur vous le demande.",
];

export default async function TeleconsultationPatientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await findByToken(await getRepo(), token);
  const valid = a && isTeleAppointment(a);
  const cabinet = isSet(SITE.CABINET_NAME) ? SITE.CABINET_NAME : `Cabinet de ${SITE.PRACTITIONER_NAME}`;

  if (!valid) {
    return (
      <section className="py-section-sm">
        <div className="container-page max-w-3xl">
          <h1 className="text-h1">Téléconsultation</h1>
          <div className="mt-8 rounded-panel border border-line bg-surface p-8" data-tele-state="invalid">
            <p className="text-ink">Ce lien ne correspond à aucune téléconsultation. Il est peut-être incomplet ou a été remplacé par un lien plus récent.</p>
            <p className="mt-2 text-small text-muted">
              Vérifiez le dernier e-mail reçu
              {hasPhone() ? `, ou appelez le cabinet au ${SITE.PHONE}` : ""}. Vous pouvez aussi recevoir un nouveau lien depuis la page de rendez-vous.
            </p>
            <Link href="/rendez-vous#modifier-annuler" className={`${buttonClasses("primary", "md")} mt-6`}>
              Recevoir un nouveau lien
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const state = patientState(a);
  const opensAt = patientOpensAt(a);
  const sameDay = localDate(opensAt, TZ) === localDate(new Date(), TZ);
  const opensAtLabel = sameDay ? `à ${formatTime(opensAt, TZ)}` : `le ${formatLongDate(opensAt, TZ)} à ${formatTime(opensAt, TZ)}`;

  return (
    <section className="py-section-sm">
      <div className="container-page max-w-5xl">
        <p className="text-small font-medium text-petrol">{cabinet}</p>
        <h1 className="mt-1 text-h1">Ma téléconsultation</h1>

        <dl className="mt-6 grid gap-3 rounded-panel border border-line bg-surface p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <dt className="text-micro text-muted">Avec</dt>
            <dd className="font-semibold">{SITE.PRACTITIONER_NAME}</dd>
          </div>
          <div>
            <dt className="text-micro text-muted">Date</dt>
            <dd className="font-semibold first-letter:uppercase">{formatLongDate(a.startAt, TZ)}</dd>
          </div>
          <div>
            <dt className="text-micro text-muted">Heure</dt>
            <dd className="font-semibold">
              {formatTime(a.startAt, TZ)} – {formatTime(a.endAt, TZ)} <span className="font-normal text-muted">({a.duration} min)</span>
            </dd>
          </div>
        </dl>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div>
            <PatientTele
              token={token}
              initialState={state}
              opensAt={opensAt}
              opensAtLabel={opensAtLabel}
              configured={videoConfigured()}
              practitionerName={SITE.PRACTITIONER_NAME}
              phone={hasPhone() ? SITE.PHONE : null}
            />
          </div>

          <aside className="space-y-6 text-small">
            <div>
              <h2 className="font-semibold">Avant de commencer</h2>
              <ul className="mt-3 space-y-2.5 text-muted">
                {INSTRUCTIONS.map((t) => (
                  <li key={t} className="flex gap-2">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-sage-deep" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-card bg-mist p-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <Icon name="shield" size={16} /> Confidentialité
              </h2>
              <p className="mt-2 text-muted">
                La salle est privée : seuls vous et votre kinésithérapeute pouvez y entrer, avec un accès personnel et temporaire. La
                séance n&apos;est pas enregistrée. Ne transférez pas ce lien.
              </p>
            </div>
            <div className="rounded-card bg-mist p-4">
              <h2 className="font-semibold">Limites de la téléconsultation</h2>
              <p className="mt-2 text-muted">
                Certains examens et soins nécessitent une séance au cabinet : votre kinésithérapeute vous le dira si c&apos;est le cas.
              </p>
            </div>
            <p className="flex gap-2 rounded-card border border-danger/30 bg-danger/5 p-4 text-ink">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-danger" />
              <span>
                En cas d&apos;urgence, ne passez pas par la téléconsultation : appelez le <strong>15</strong> (ou le 112).
              </span>
            </p>
            <p className="text-muted">
              Besoin de déplacer ou d&apos;annuler ?{" "}
              <Link href={`/rendez-vous/gestion/${token}`} className="link">
                Gérer mon rendez-vous
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
