import { SITE, directionsUrl, fullAddress, hasPhone, isAddressSet, isSet, telHref } from "@/data/site";
import { bookingConfig } from "@/lib/booking/config";
import { getRepo } from "@/lib/booking/server";
import { bookableServices } from "@/lib/booking/service";
import { getOpeningDays } from "@/lib/booking/opening-hours";
import { addDays, localDate } from "@/lib/booking/time";
import { pageMetadata, cityLabel } from "@/lib/seo";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { SoinsHero } from "@/components/sections/SoinsHero";
import { buttonClasses } from "@/components/ui/Button";
import { ManageLinkRequest } from "@/components/booking/ManageLinkRequest";
import { Icon, type IconName } from "@/components/ui/Icon";
import { OpeningHours } from "@/components/ui/OpeningHours";

export const dynamic = "force-dynamic";

const who = isSet(SITE.LOGO_TEXT) ? SITE.LOGO_TEXT : "le cabinet";

export const metadata = pageMetadata({
  title: `Prendre rendez-vous chez ${who}`,
  description: `Réservez en ligne votre rendez-vous de kinésithérapie à ${cityLabel} : choisissez votre consultation, la date et l'horaire.`,
  path: "/rendez-vous",
});

export default async function RendezVousPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const params = await searchParams;
  const service = typeof params.service === "string" ? params.service : null;
  const today = localDate(new Date(), bookingConfig.timezone);
  const lastDate = addDays(today, bookingConfig.maximumAdvanceDays);
  const openingDays = await getOpeningDays();
  // Base de données injoignable (ex. Turso pas encore configuré) : pas de faux formulaire, on oriente vers le téléphone
  const services = await getRepo()
    .then((repo) => bookableServices(repo))
    .catch((error) => {
      console.error("[rendez-vous] Réservation en ligne indisponible :", error);
      return null;
    });
  const directions = directionsUrl();

  // Informations pratiques : uniquement ce qui est réellement renseigné
  const access: { icon: IconName; label: string; value: string }[] = [
    { icon: "access" as IconName, label: "Accessibilité", value: SITE.ACCESS.accessibility },
    { icon: "car" as IconName, label: "Stationnement", value: SITE.ACCESS.parking },
    { icon: "bus" as IconName, label: "Transports", value: SITE.ACCESS.transport },
  ].filter((r) => isSet(r.value));

  return (
    <>
      <SoinsHero
        badge={{ icon: "calendar", label: "Prendre rendez-vous" }}
        title="Votre santé mérite du temps"
        intro="Réservez facilement votre séance en ligne ou contactez-moi directement par téléphone. Je vous réponds rapidement pour trouver le créneau qui vous convient."
        image={{
          src: "/images/rendez-vous-banniere.jpg",
          alt: "Calendrier de réservation posé sur un bureau, à côté d'un téléphone",
          position: "70% 50%",
        }}
        actions={
          <>
            <a href="#reserver" className={buttonClasses("primary", "lg", "rounded-full")}>
              <Icon name="calendar" size={18} />
              Prendre rendez-vous
              <Icon name="chevronDown" size={18} />
            </a>
            {hasPhone() && (
              <a href={telHref(SITE.PHONE)} className={buttonClasses("secondary", "lg", "rounded-full")}>
                <Icon name="phone" size={18} />
                Me contacter
              </a>
            )}
          </>
        }
        signature="À très bientôt au cabinet !"
        crumb={{ label: "Rendez-vous", href: "/rendez-vous" }}
      />

      <section id="reserver" aria-label="Réserver en ligne" className="scroll-mt-32 py-10 sm:py-14">
        <div className="container-page max-w-5xl">
          <a
            href="#modifier-annuler"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-small font-medium text-ink transition-colors hover:border-petrol/40 hover:text-petrol"
          >
            <Icon name="calendar" size={16} className="text-petrol" />
            Vous avez déjà un rendez-vous ? Modifier ou annuler
            <Icon name="chevronDown" size={16} className="text-muted" />
          </a>
          {services ? (
            <BookingFlow
              services={services}
              initialServiceId={service}
              today={today}
              lastDate={lastDate}
              phone={hasPhone() ? SITE.PHONE : null}
            />
          ) : (
            <div role="status" className="rounded-panel border border-warning/40 bg-warning-soft p-6 sm:p-8">
              <p className="font-semibold">La réservation en ligne est momentanément indisponible.</p>
              <p className="mt-2 text-small text-ink">
                {hasPhone() ? (
                  <>
                    Pour prendre rendez-vous, appelez le cabinet au{" "}
                    <a href={telHref(SITE.PHONE)} className="link font-medium">
                      {SITE.PHONE}
                    </a>
                    .
                  </>
                ) : (
                  "Merci de contacter le cabinet pour prendre rendez-vous."
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="modifier-annuler" aria-labelledby="modifier-annuler-titre" className="scroll-mt-32 border-t border-line py-section-sm">
        <div className="container-page grid max-w-5xl gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <h2 id="modifier-annuler-titre" className="text-h2">
              Modifier ou annuler un rendez-vous
            </h2>
            <p className="mt-4 text-muted">
              Utilisez le bouton <strong className="font-semibold text-ink">« Gérer mon rendez-vous »</strong> de
              l&apos;e-mail de confirmation : il permet de changer d&apos;horaire ou d&apos;annuler en quelques clics.
            </p>
            <ul className="mt-6 space-y-3 text-small text-ink/90">
              <li className="flex gap-3">
                <Icon name="clock" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                En ligne jusqu&apos;à {bookingConfig.cancellationDeadlineHours} heures avant le rendez-vous.
              </li>
              <li className="flex gap-3">
                <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                {bookingConfig.cancellationPolicy}
              </li>
              {hasPhone() && (
                <li className="flex gap-3">
                  <Icon name="phone" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                  <span>
                    Au-delà, ou si vous préférez, appelez le cabinet au{" "}
                    <a href={telHref(SITE.PHONE)} className="link whitespace-nowrap font-medium">
                      {SITE.PHONE}
                    </a>
                    .
                  </span>
                </li>
              )}
              <li className="flex gap-3">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                Prévenez au plus tôt : le créneau libéré pourra servir à un autre patient.
              </li>
            </ul>
          </div>

          <div className="self-start rounded-panel border border-line bg-surface p-6 sm:p-8">
            <h3 className="text-h3">Vous ne retrouvez pas l&apos;e-mail ?</h3>
            <p className="mb-6 mt-2 text-small text-muted">
              Indiquez l&apos;adresse e-mail utilisée lors de la réservation : nous vous renvoyons le lien pour gérer vos
              rendez-vous à venir.
            </p>
            <ManageLinkRequest />
          </div>
        </div>
      </section>

      <section aria-labelledby="infos-pratiques" className="border-t border-line bg-surface py-section-sm">
        <div className="container-page grid max-w-5xl gap-12 md:grid-cols-2">
          <div>
            <h2 id="infos-pratiques" className="text-h3">
              Informations pratiques
            </h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {isAddressSet() && (
                <li className="flex gap-3 py-4">
                  <Icon name="pin" size={20} className="mt-0.5 shrink-0 text-petrol" />
                  <div>
                    <p className="font-medium text-ink">{fullAddress()}</p>
                    {directions && (
                      <a href={directions} target="_blank" rel="noopener noreferrer" className="link text-small">
                        Itinéraire<span className="sr-only"> (nouvel onglet)</span>
                      </a>
                    )}
                  </div>
                </li>
              )}
              {hasPhone() && (
                <li className="flex gap-3 py-4">
                  <Icon name="phone" size={20} className="mt-0.5 shrink-0 text-petrol" />
                  <div>
                    <a href={telHref(SITE.PHONE)} className="font-medium text-ink hover:text-petrol">
                      {SITE.PHONE}
                    </a>
                    <p className="text-small text-muted">Pour toute question, ou si vous préférez réserver par téléphone.</p>
                  </div>
                </li>
              )}
              {access.map((a) => (
                <li key={a.label} className="flex gap-3 py-4">
                  <Icon name={a.icon} size={20} className="mt-0.5 shrink-0 text-petrol" />
                  <div>
                    <p className="text-small text-muted">{a.label}</p>
                    <p className="text-ink">{a.value}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-small text-muted">
              Pour la première séance, apportez votre ordonnance, votre carte Vitale et vos examens récents.
            </p>
          </div>
          <div>
            <h2 className="text-h3">Horaires</h2>
            <OpeningHours days={openingDays} className="mt-3" />
          </div>
        </div>
      </section>
    </>
  );
}
