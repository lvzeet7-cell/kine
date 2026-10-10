import type { ReactNode } from "react";
import { practitioner } from "@/data/practitioner";
import { images } from "@/data/images";
import { SITE, TODO, isSet } from "@/data/site";
import { pageMetadata, cityLabel } from "@/lib/seo";
import { SoinsHero } from "@/components/sections/SoinsHero";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Value } from "@/components/ui/Value";
import { BookingButton } from "@/components/ui/BookingButton";
import { BookingCTA } from "@/components/sections/BookingCTA";

export const metadata = pageMetadata({
  title: "Le kinésithérapeute",
  description: `Présentation du kinésithérapeute du cabinet à ${cityLabel} : parcours, diplômes, formations et approche des soins.`,
  path: "/kinesitherapeute",
});

const text = (s: string) => (s.includes(TODO) ? <Value>{s}</Value> : s);

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t border-line py-10 sm:grid-cols-[11rem_1fr] sm:gap-10">
      <h2 id={id} className="text-h3">
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
          <span>{text(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PractitionerPage() {
  const name = isSet(practitioner.name) ? practitioner.name : null;
  const photo = { ...images.practitioner, alt: images.practitioner.alt || (name ? `Portrait de ${name}` : "") };

  return (
    <>
      <SoinsHero
        reverse
        badge={{ icon: "person", label: "Le kiné" }}
        title="Une expertise au service de votre santé"
        intro={
          <p>
            <strong className="font-semibold text-petrol">Fort de 33 ans d&apos;expérience en kinésithérapie</strong>, je vous
            accompagne avec <strong className="font-semibold text-petrol">une approche personnalisée</strong>, basée sur
            l&apos;écoute, l&apos;examen clinique et des techniques adaptées à vos besoins.
          </p>
        }
        features={[
          { icon: "stride", label: "Kinésithérapie du sport" },
          { icon: "spine", label: "Méthode McKenzie – MDT" },
          { icon: "hand", label: "Thérapie manuelle" },
          { icon: "target", label: "Rééducation fonctionnelle" },
          { icon: "shield", label: "Prévention des blessures" },
        ]}
        image={{
          src: "/images/kine-banniere.jpg",
          alt: "Kinésithérapeute mobilisant le genou d'un patient",
          position: "45% 30%",
        }}
        crumb={{ label: "Le kinésithérapeute", href: "/kinesitherapeute" }}
      />

      <div className="container-page grid gap-12 py-section-sm lg:grid-cols-[22rem_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ImageFrame
            image={photo}
            aspect={photo.width === photo.height ? "aspect-square" : "aspect-[4/5]"}
            sizes="(min-width: 1024px) 352px, 100vw"
            className={photo.src && photo.width < 600 ? "max-w-[15rem]" : "mx-auto max-w-sm lg:max-w-none"}
          />
          <div className={photo.src && photo.width < 600 ? "mt-6 max-w-[15rem]" : "mx-auto mt-6 max-w-sm lg:max-w-none"}>
            <p className="text-[1.375rem] font-semibold tracking-[-0.015em]">
              <Value>{SITE.PRACTITIONER_NAME}</Value>
            </p>
            <p className="mt-1 text-muted">{practitioner.title}</p>
            <BookingButton className="mt-6 w-full" />
          </div>
        </div>

        <div className="min-w-0">
          <section aria-labelledby="presentation">
            <h2 id="presentation" className="text-h2">
              Présentation
            </h2>
            <div className="mt-6 max-w-prose space-y-4 text-lead text-ink/90">
              {practitioner.intro.map((p, i) => (
                <p key={i}>{text(p)}</p>
              ))}
            </div>
          </section>

          <div className="mt-12">
            {practitioner.approach.length > 0 && (
              <Block id="approche" title="Approche">
                <div className="max-w-prose space-y-4">
                  {practitioner.approach.map((p, i) => (
                    <p key={i}>{text(p)}</p>
                  ))}
                </div>
              </Block>
            )}
            {practitioner.career.length > 0 && (
              <Block id="parcours" title="Parcours">
                <ol className="space-y-4">
                  {practitioner.career.map((c, i) => (
                    <li key={i} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
                      <span className="text-small font-semibold tabular-nums text-petrol">{text(c.period)}</span>
                      <span>{text(c.text)}</span>
                    </li>
                  ))}
                </ol>
              </Block>
            )}
            {practitioner.diplomas.length > 0 && (
              <Block id="diplomes" title="Diplômes">
                <List items={practitioner.diplomas} />
              </Block>
            )}
            {practitioner.trainings.length > 0 && (
              <Block id="formations" title="Formations">
                <List items={practitioner.trainings} />
              </Block>
            )}
            {practitioner.specialties.length > 0 && (
              <Block id="specialites" title="Domaines d'intervention">
                <List items={practitioner.specialties} />
              </Block>
            )}
          </div>
        </div>
      </div>

      <BookingCTA />
    </>
  );
}
