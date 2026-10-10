import Link from "next/link";
import { SITE, isSet } from "@/data/site";
import { services } from "@/data/services";
import { faq } from "@/data/faq";
import { pageMetadata, cityLabel, siteName } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { TrustBar } from "@/components/sections/TrustBar";
import { CabinetIntro } from "@/components/sections/CabinetIntro";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { Testimonials } from "@/components/sections/Testimonials";
import { BookingCTA } from "@/components/sections/BookingCTA";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceGrid } from "@/components/ui/ServiceCard";
import { FAQ } from "@/components/ui/FAQ";
import { ContactDetails } from "@/components/ui/ContactDetails";
import { OpeningHours } from "@/components/ui/OpeningHours";
import { getOpeningDays } from "@/lib/booking/opening-hours";
import { Map } from "@/components/ui/Map";

export const metadata = pageMetadata({
  title: `Kinésithérapeute à ${cityLabel} | ${siteName}`,
  description: `Cabinet de kinésithérapie à ${cityLabel}. Rééducation, accompagnement personnalisé et prise de rendez-vous en ligne ou par téléphone.`,
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  const openingDays = await getOpeningDays();
  const homeFaq = faq.filter((f) => f.home);

  return (
    <>
      <Hero />
      <TrustBar />
      <CabinetIntro />

      <section aria-labelledby="soins-title" className="border-t border-line bg-surface/60 py-section">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              id="soins-title"
              title="Soins conventionnés"
              intro="Des prises en charge spécifiques, remboursées par l'Assurance Maladie sur prescription médicale."
            />
            <Link href="/soins" className="link shrink-0 self-start md:mb-2 md:self-auto">
              Tous les soins conventionnés
            </Link>
          </div>
          <div className="reveal mt-12">
            <ServiceGrid items={services} />
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-card border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-h3">Soins non conventionnés</h3>
              <p className="mt-1 text-small text-muted">Des soins hors nomenclature, non remboursés par l&apos;Assurance Maladie.</p>
            </div>
            <Link href="/soins-non-conventionnes" className="link shrink-0">
              Découvrir les soins non conventionnés
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="parcours-title" className="py-section">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              id="parcours-title"
              title="Comment se déroule une prise en charge"
              intro="Quatre étapes, pour avancer avec des repères clairs du premier rendez-vous jusqu'au suivi."
            />
            <Link href="/deroulement" className="link shrink-0 self-start md:mb-2 md:self-auto">
              Voir le déroulement en détail
            </Link>
          </div>
          <div className="mt-14">
            <ProcessSteps variant="compact" />
          </div>
        </div>
      </section>

      <Testimonials />

      <section aria-labelledby="acces-title" className="border-y border-line bg-surface py-section">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              id="acces-title"
              title={isSet(SITE.CITY) ? `Le cabinet à ${SITE.CITY}` : "Venir au cabinet"}
              intro="Adresse, horaires et itinéraire."
            />
            <div className="mt-8">
              <ContactDetails />
            </div>
            <h3 className="mt-10 text-h3">Horaires</h3>
            <OpeningHours days={openingDays} className="mt-3" />
          </div>
          <Map className="lg:pt-2" />
        </div>
      </section>

      <section aria-labelledby="faq-title" className="py-section">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading id="faq-title" title="Questions fréquentes" intro="Les réponses aux questions les plus posées avant un premier rendez-vous." />
            <p className="mt-6">
              <Link href="/faq" className="link">
                Voir toutes les questions
              </Link>
            </p>
          </div>
          <FAQ items={homeFaq} />
        </div>
      </section>

      <BookingCTA />
    </>
  );
}
