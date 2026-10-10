import { pageMetadata, cityLabel } from "@/lib/seo";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactDetails, AccessInfo } from "@/components/ui/ContactDetails";
import { OpeningHours } from "@/components/ui/OpeningHours";
import { getOpeningDays } from "@/lib/booking/opening-hours";
import { ContactForm } from "@/components/ui/ContactForm";
import { Map } from "@/components/ui/Map";

export const metadata = pageMetadata({
  title: "Contact et accès",
  description: `Adresse, téléphone, horaires et plan d'accès du cabinet de kinésithérapie à ${cityLabel}. Formulaire de contact pour vos questions.`,
  path: "/contact",
});

export default async function ContactPage() {
  const openingDays = await getOpeningDays();
  return (
    <>
      <PageHeader
        title="Contact et accès"
        intro="Pour une question pratique ou administrative, appelez le cabinet ou utilisez le formulaire. Pour réserver une séance, passez par la page Rendez-vous."
        crumbs={[{ label: "Contact", href: "/contact" }]}
      />

      <section className="py-section-sm">
        <div className="container-page grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="min-w-0">
            <h2 className="text-h3">Coordonnées</h2>
            <div className="mt-3">
              <ContactDetails />
            </div>
            <h2 className="mt-10 text-h3">Horaires</h2>
            <OpeningHours days={openingDays} className="mt-3" />
          </div>
          <div className="min-w-0">
            <ContactForm />
          </div>
        </div>
      </section>

      <section aria-labelledby="plan" className="border-t border-line bg-surface py-section-sm">
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <h2 id="plan" className="text-h2">
              Plan d&apos;accès
            </h2>
            <div className="mt-6">
              <AccessInfo />
            </div>
          </div>
          <Map />
        </div>
      </section>
    </>
  );
}
