import { cabinet } from "@/data/cabinet";
import { gallery } from "@/data/images";
import { SITE, TODO, fullAddress, isAddressSet, isSet } from "@/data/site";
import { getOpeningDays } from "@/lib/booking/opening-hours";
import { openingSummary } from "@/lib/booking/opening-summary";
import { pageMetadata, cityLabel } from "@/lib/seo";
import { SoinsHero } from "@/components/sections/SoinsHero";
import { Gallery } from "@/components/ui/Gallery";
import { AccessInfo, ContactDetails } from "@/components/ui/ContactDetails";
import { Map } from "@/components/ui/Map";
import { Icon } from "@/components/ui/Icon";
import { Value } from "@/components/ui/Value";
import { BookingCTA } from "@/components/sections/BookingCTA";

export const metadata = pageMetadata({
  title: "Le cabinet",
  description: `Découvrez le cabinet de kinésithérapie à ${cityLabel} : lieu, équipements, accessibilité et plan d'accès.`,
  path: "/cabinet",
});

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-4 text-ink/90">
      {items.map((p, i) => (
        <p key={i}>{p.includes(TODO) ? <Value>{p}</Value> : p}</p>
      ))}
    </div>
  );
}

export default async function CabinetPage() {
  const hours = openingSummary(await getOpeningDays());
  const strip = (v: string) => v.replace(/\.$/, "");
  const infos = [
    isAddressSet() && { icon: "pin" as const, label: "Situation géographique", detail: fullAddress() },
    isSet(SITE.ACCESS.parking) && { icon: "car" as const, label: "Stationnement", detail: strip(SITE.ACCESS.parking) },
    hours && { icon: "clock" as const, label: "Horaires d'ouverture", detail: hours },
    isSet(SITE.ACCESS.accessibility) && { icon: "access" as const, label: "Accessibilité", detail: strip(SITE.ACCESS.accessibility) },
  ].filter((x): x is { icon: "pin" | "car" | "clock" | "access"; label: string; detail: string } => !!x);

  return (
    <>
      <SoinsHero
        badge={{ icon: "home", label: isSet(SITE.CITY) ? `Le cabinet à ${SITE.CITY}` : "Le cabinet" }}
        title="Un cadre dédié à votre rééducation"
        intro="Le cabinet est équipé de matériel moderne et fonctionnel pour vous offrir une prise en charge complète, dans un environnement agréable, calme et propice à la récupération."
        features={[
          { icon: "dumbbell", label: "Équipements modernes" },
          { icon: "shield", label: "Espace sécurisé et confortable" },
          { icon: "pin", label: "Accès facile et parking" },
          { icon: "leaf", label: "Ambiance calme et bienveillante" },
        ]}
        image={{
          src: "/images/cabinet-banniere.jpg",
          alt: "Salle de soins lumineuse avec tables de kinésithérapie, espalier et plantes",
          position: "40% 50%",
        }}
        card={infos.length > 0 ? { tone: "light", icon: "pin", title: "Le cabinet en quelques infos", items: infos } : undefined}
        crumb={{ label: "Le cabinet", href: "/cabinet" }}
      />

      <section aria-labelledby="presentation" className="py-section-sm">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <h2 id="presentation" className="text-h2">
            Présentation
          </h2>
          <div className="max-w-prose text-lead">
            <Paragraphs items={cabinet.presentation} />
          </div>
        </div>
      </section>

      <section aria-labelledby="photos" className="pb-section-sm">
        <div className="container-page">
          <h2 id="photos" className="sr-only">
            Photos du cabinet
          </h2>
          <Gallery items={gallery} />
        </div>
      </section>

      <section aria-labelledby="equipements" className="border-y border-line bg-surface py-section-sm">
        <div className="container-page grid gap-12 md:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="equipements" className="text-h2">
              Équipements
            </h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {cabinet.equipment.map((item, i) => (
                <li key={i} className="flex gap-3 py-4">
                  <Icon name="check" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
                  <Value>{item}</Value>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-h2">Environnement</h2>
            <div className="mt-8">
              <Paragraphs items={cabinet.environment} />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="acces" className="py-section-sm">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 id="acces" className="text-h2">
              Accès et localisation
            </h2>
            <div className="mt-8">
              <ContactDetails />
            </div>
            <h3 className="mt-10 text-h3">Accessibilité et accès</h3>
            <div className="mt-2">
              <AccessInfo />
            </div>
          </div>
          <Map />
        </div>
      </section>

      <BookingCTA />
    </>
  );
}
