import { services } from "@/data/services";
import { pageMetadata, cityLabel } from "@/lib/seo";
import { SoinsHero } from "@/components/sections/SoinsHero";
import { ServiceGrid } from "@/components/ui/ServiceCard";
import { BookingCTA } from "@/components/sections/BookingCTA";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export const metadata = pageMetadata({
  title: "Soins conventionnés",
  description: `Les soins conventionnés du cabinet de kinésithérapie à ${cityLabel}, pris en charge par l'Assurance Maladie sur prescription médicale.`,
  path: "/soins",
});

export default function SoinsPage() {
  return (
    <>
      <SoinsHero
        badge={{ icon: "shield", label: "Soins conventionnés" }}
        title="Soins conventionnés"
        intro="Des soins réalisés sur prescription médicale et pris en charge par l'Assurance Maladie, selon les conditions en vigueur. Chaque prise en charge commence par un bilan, puis les séances sont adaptées à votre situation."
        features={[
          { icon: "document", label: "Prise en charge par l'Assurance Maladie" },
          { icon: "clipboard", label: "Bilan initial complet" },
          { icon: "person", label: "Suivi personnalisé selon votre pathologie" },
          { icon: "calendar", label: "Séances adaptées à votre évolution" },
        ]}
        image={{
          src: "/images/soins-conventionnes.jpg",
          alt: "Kinésithérapeute mobilisant la hanche et le genou d'un patient allongé",
          position: "35% 30%",
        }}
        card={{
          tone: "light",
          icon: "shield",
          title: "Ce qui est pris en charge",
          items: [
            { label: "Séances de kinésithérapie" },
            { label: "Rééducation fonctionnelle" },
            { label: "Traitement des douleurs" },
            { label: "Réadaptation à l'effort" },
            { label: "Suivi post-blessure / post-opératoire" },
          ],
        }}
        crumb={{ label: "Soins conventionnés", href: "/soins" }}
      />
      <section className="py-section-sm">
        <div className="container-page">
          <ServiceGrid items={services} headingLevel="h2" />
          <div className="mt-10 flex max-w-2xl gap-3 text-small text-muted">
            <Icon name="info" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
            <p>
              Vous ne savez pas si votre situation relève de l&apos;une de ces prises en charge ?{" "}
              <Link href="/contact" className="link">
                Contactez le cabinet
              </Link>{" "}
              : nous vous orienterons.
            </p>
          </div>
          <p className="mt-4 text-small">
            <Link href="/soins-non-conventionnes" className="link">
              Voir aussi les soins non conventionnés
            </Link>
          </p>
        </div>
      </section>
      <BookingCTA />
    </>
  );
}
