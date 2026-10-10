import Link from "next/link";
import { nonConventionnes } from "@/data/non-conventionnes";
import { TODO } from "@/data/site";
import { pageMetadata, cityLabel } from "@/lib/seo";
import { SoinsHero } from "@/components/sections/SoinsHero";
import { BookingCTA } from "@/components/sections/BookingCTA";
import { Icon } from "@/components/ui/Icon";
import { Value } from "@/components/ui/Value";

export const metadata = pageMetadata({
  title: "Soins non conventionnés",
  description: `Les soins non conventionnés du cabinet de kinésithérapie à ${cityLabel} : soins hors nomenclature, non remboursés par l'Assurance Maladie, avec leurs tarifs.`,
  path: "/soins-non-conventionnes",
});

const text = (s: string) => (s.includes(TODO) ? <Value>{s}</Value> : s);

export default function SoinsNonConventionnesPage() {
  return (
    <>
      <SoinsHero
        badge={{ icon: "person", label: "Soins non conventionnés" }}
        title="Soins non conventionnés"
        intro="Des prestations complémentaires, en dehors du cadre de l'Assurance Maladie : elles ne sont pas remboursées par la Sécurité sociale, mais certaines complémentaires santé peuvent en prendre une partie en charge. Elles sont particulièrement adaptées aux bilans approfondis, aux sportifs et à la récupération."
        features={[
          { icon: "target", label: "Bilan complet et approfondi" },
          { icon: "stride", label: "Accompagnement sportif personnalisé" },
          { icon: "refresh", label: "Récupération après l'effort" },
          { icon: "plus", label: "Suivi sur mesure selon vos objectifs" },
        ]}
        image={{
          src: "/images/soins-non-conventionnes.jpg",
          alt: "Kinésithérapeute massant le dos d'un sportif allongé, dans une salle équipée",
          position: "50% 30%",
        }}
        card={{
          tone: "dark",
          icon: "person",
          title: "Des prestations complémentaires",
          items: nonConventionnes.map((c) => ({ label: c.title, href: `/soins-non-conventionnes/${c.slug}` })),
          tagline: "Un accompagnement plus global, pour aller plus loin.",
        }}
        crumb={{ label: "Soins non conventionnés", href: "/soins-non-conventionnes" }}
      />

      <section aria-labelledby="liste-soins" className="py-section-sm">
        <div className="container-page">
          <h2 id="liste-soins" className="sr-only">
            Liste des soins non conventionnés
          </h2>
          <ul className={`grid gap-4 sm:grid-cols-2 ${nonConventionnes.length % 3 === 0 ? "lg:grid-cols-3" : ""}`}>
            {nonConventionnes.map((soin) => (
              <li
                key={soin.slug}
                className="group relative flex flex-col rounded-card border border-line bg-surface p-7 transition-colors duration-200 hover:border-petrol/30 hover:bg-[rgb(var(--petrol-soft)/0.45)] sm:p-8"
              >
                <h3 className="text-h3">
                  <Link
                    href={`/soins-non-conventionnes/${soin.slug}`}
                    className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-card focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-4 focus-visible:after:outline-petrol"
                  >
                    {soin.title}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-small text-muted">{text(soin.description)}</p>
                <dl className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-line pt-4">
                  {soin.duration && (
                    <div className="flex items-center gap-1.5 text-small text-muted">
                      <dt className="sr-only">Durée</dt>
                      <Icon name="clock" size={16} className="text-sage-deep" />
                      <dd>{text(soin.duration)}</dd>
                    </div>
                  )}
                  <div className="text-right">
                    <dt className="sr-only">Tarif</dt>
                    <dd className="text-[1.25rem] font-semibold tabular-nums text-petrol">{text(soin.price)}</dd>
                  </div>
                </dl>
                <span aria-hidden="true" className="mt-5 inline-flex items-center gap-1.5 text-small font-semibold text-petrol">
                  En savoir plus
                  <Icon name="chevronRight" size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="flex gap-3 rounded-card bg-sage-soft p-5 text-small text-ink/90">
              <Icon name="info" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
              <p>Le tarif vous est communiqué avant la séance. Une facture peut vous être remise pour votre complémentaire santé.</p>
            </div>
            <div className="flex gap-3 rounded-card border border-line bg-surface p-5 text-small text-ink/90">
              <Icon name="check" size={20} className="mt-0.5 shrink-0 text-petrol" />
              <p>
                Vous avez une ordonnance pour des séances de rééducation ? Consultez les{" "}
                <Link href="/soins" className="link">
                  soins conventionnés
                </Link>
                , pris en charge par l&apos;Assurance Maladie.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BookingCTA />
    </>
  );
}
