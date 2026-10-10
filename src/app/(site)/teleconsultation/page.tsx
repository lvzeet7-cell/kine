import Link from "next/link";
import { SITE, hasPhone, telHref } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { getRepo } from "@/lib/booking/server";
import { TELE_DEFAULTS, formatPrice, getTeleSettings } from "@/lib/teleconsultation/settings";
import { videoConfigured } from "@/lib/video";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Téléconsultation",
  description: `Téléconsultation de kinésithérapie avec ${SITE.PRACTITIONER_NAME} : un rendez-vous en vidéo, depuis chez vous, dans une salle privée et sans enregistrement.`,
  path: "/teleconsultation",
});

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "calendar", title: "Réservez en ligne", text: "Choisissez « Téléconsultation » puis un créneau. Vous recevez un e-mail de confirmation avec votre lien personnel." },
  { icon: "video", title: "Testez votre matériel", text: "Depuis votre lien, vérifiez votre caméra et votre micro à l'avance. Aucune application à installer : un navigateur récent suffit." },
  { icon: "person", title: "Rejoignez la salle", text: "La salle ouvre 15 minutes avant l'horaire. Vous patientez en salle d'attente jusqu'à l'arrivée de votre kinésithérapeute." },
];

export default async function TeleconsultationPage() {
  const settings = await getRepo()
    .then((repo) => getTeleSettings(repo))
    .catch(() => null);
  const available = !!settings && settings.enabled && videoConfigured();
  const price = formatPrice(settings?.priceCents ?? null);

  return (
    <>
      <PageHeader
        title="Téléconsultation"
        intro={`Un rendez-vous en vidéo avec ${SITE.PRACTITIONER_NAME}, depuis chez vous : pour un suivi, des conseils ou la reprise de vos exercices.`}
        crumbs={[{ label: "Téléconsultation", href: "/teleconsultation" }]}
      />

      <section className="py-section-sm">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h2 className="text-h2">Comment ça se passe ?</h2>
            <ol className="mt-8 space-y-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-petrol-soft text-petrol">
                    <Icon name={s.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="font-semibold">
                      {i + 1}. {s.title}
                    </h3>
                    <p className="mt-1 text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h2 className="mt-14 text-h2">Bon à savoir</h2>
            <ul className="mt-6 space-y-3 text-muted">
              <li className="flex gap-2">
                <Icon name="shield" size={18} className="mt-1 shrink-0 text-sage-deep" />
                La salle vidéo est privée : l&apos;accès est personnel et temporaire, et la séance n&apos;est pas enregistrée.
              </li>
              <li className="flex gap-2">
                <Icon name="person" size={18} className="mt-1 shrink-0 text-sage-deep" />
                Elle s&apos;adresse aux patients déjà suivis au cabinet : le premier bilan se fait toujours en présentiel, et une séance au
                cabinet doit avoir eu lieu au cours des 12 derniers mois.
              </li>
              <li className="flex gap-2">
                <Icon name="info" size={18} className="mt-1 shrink-0 text-sage-deep" />
                La téléconsultation ne remplace pas toujours une séance au cabinet : certains examens et soins nécessitent d&apos;être sur place.
              </li>
              <li className="flex gap-2">
                <Icon name="check" size={18} className="mt-1 shrink-0 text-sage-deep" />
                Pour un patient mineur, un parent (ou un adulte autorisé) doit être présent pendant la séance.
              </li>
              <li className="flex gap-2">
                <Icon name="alert" size={18} className="mt-1 shrink-0 text-danger" />
                En cas d&apos;urgence, appelez le 15 (ou le 112).
              </li>
            </ul>
          </div>

          <aside className="self-start rounded-panel border border-line bg-surface p-6 shadow-lift" aria-labelledby="tele-infos">
            <h2 id="tele-infos" className="text-[1.25rem] font-semibold">
              Téléconsultation
            </h2>
            <dl className="mt-4 divide-y divide-line text-small">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Durée</dt>
                <dd className="font-semibold">{settings?.duration ?? TELE_DEFAULTS.duration} minutes</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Tarif</dt>
                <dd className="text-right font-semibold">{price ?? "Communiqué par le cabinet"}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Prise en charge</dt>
                <dd className="text-right font-semibold">Renseignez-vous auprès du cabinet</dd>
              </div>
            </dl>
            {available ? (
              <Link href="/rendez-vous?service=teleconsultation#reserver" className={buttonClasses("primary", "md", "mt-5 w-full")}>
                <Icon name="video" size={18} />
                Réserver une téléconsultation
              </Link>
            ) : (
              <p role="status" className="mt-5 rounded-card bg-warning-soft p-4 text-small text-ink">
                La réservation de téléconsultation n&apos;est pas ouverte pour le moment.
                {hasPhone() && (
                  <>
                    {" "}
                    Contactez le cabinet au{" "}
                    <a href={telHref(SITE.PHONE)} className="link font-medium">
                      {SITE.PHONE}
                    </a>
                    .
                  </>
                )}
              </p>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
