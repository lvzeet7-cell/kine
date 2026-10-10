import { SITE, hasPhone } from "@/data/site";
import { BookingButton, CallButton } from "@/components/ui/BookingButton";
import { LogoMark } from "@/components/layout/Logo";

/** Bandeau de fin de page : prise de rendez-vous */
export function BookingCTA({
  title = "Prendre rendez-vous",
  text = "Réservez en ligne en quelques clics, ou appelez le cabinet si vous avez une question avant votre première séance.",
  service,
}: {
  title?: string;
  text?: string;
  /** Présélectionne un type de rendez-vous */
  service?: string;
}) {
  return (
    <section aria-labelledby="cta-title" className="pb-section pt-4">
      <div className="container-page">
        <div className="on-dark relative overflow-hidden rounded-panel bg-petrol px-6 py-14 text-white sm:px-12 lg:px-16 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 opacity-[0.08] sm:-right-10">
            <LogoMark size={340} tone="light" />
          </div>
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
            <div className="max-w-xl">
              <h2 id="cta-title" className="text-h2 text-white">
                {title}
              </h2>
              <p className="mt-4 text-lead text-white/80">{text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <BookingButton variant="light" size="lg" withIcon service={service} />
              {hasPhone() && <CallButton variant="outlineLight" size="lg" label={SITE.PHONE} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
