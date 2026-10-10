import Image from "next/image";
import Link from "next/link";
import { legalNav, mainNav } from "@/data/navigation";
import { services } from "@/data/services";
import { nonConventionnes } from "@/data/non-conventionnes";
import {
  type OpeningDay,
  SITE,
  fullAddress,
  directionsUrl,
  hasEmail,
  hasPhone,
  isAddressSet,
  isSet,
  telHref,
} from "@/data/site";
import { BookingButton } from "@/components/ui/BookingButton";
import { OpeningHours } from "@/components/ui/OpeningHours";
import { practitioner } from "@/data/practitioner";
import { Logo } from "./Logo";

export function Footer({ openingDays }: { openingDays: OpeningDay[] }) {
  const year = new Date().getFullYear();
  const directions = directionsUrl();
  const social = [
    { label: "Instagram", href: SITE.INSTAGRAM_URL },
    { label: "Facebook", href: SITE.FACEBOOK_URL },
  ].filter((s) => isSet(s.href));

  return (
    <footer className="on-dark bg-petrol-deep text-white/80">
      <div className="container-page py-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Logo tone="light" />
            <address className="mt-8 space-y-2 text-small not-italic">
              <p>{isAddressSet() ? fullAddress() : `Adresse : ${fullAddress()}`}</p>
              {directions && (
                <p>
                  <a href={directions} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
                    Itinéraire<span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </p>
              )}
              <p>
                {hasPhone() ? (
                  <a href={telHref(SITE.PHONE)} className="font-medium text-white hover:underline">
                    {SITE.PHONE}
                  </a>
                ) : (
                  <>Téléphone : {SITE.PHONE}</>
                )}
              </p>
              {hasEmail() && (
                <p>
                  <a href={`mailto:${SITE.EMAIL}`} className="hover:underline">
                    {SITE.EMAIL}
                  </a>
                </p>
              )}
            </address>
            <BookingButton variant="light" size="md" className="mt-8" />
          </div>

          <nav aria-label="Plan du site" className="lg:col-span-2">
            <h2 className="text-small font-semibold text-white">Navigation</h2>
            <ul className="mt-5 space-y-3 text-small">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/rendez-vous" className="transition-colors hover:text-white">
                  Rendez-vous
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Soins" className="lg:col-span-3">
            <h2 className="text-small font-semibold text-white">Soins conventionnés</h2>
            <ul className="mt-5 space-y-3 text-small">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/soins/${s.slug}`} className="transition-colors hover:text-white">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mt-8 text-small font-semibold text-white">
              <Link href="/soins-non-conventionnes" className="transition-colors hover:text-white/80">
                Soins non conventionnés
              </Link>
            </h2>
            <ul className="mt-5 space-y-3 text-small">
              {nonConventionnes.map((c) => (
                <li key={c.slug}>
                  <Link href={`/soins-non-conventionnes/${c.slug}`} className="transition-colors hover:text-white">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="text-small font-semibold text-white">Horaires</h2>
            <OpeningHours days={openingDays} tone="light" className="mt-3" />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:gap-6">
          <span className="inline-flex w-fit rounded-control bg-white px-4 py-2">
            <Image
              src="/images/logo-ordre-mk.png"
              alt="Ordre des masseurs-kinésithérapeutes"
              width={1126}
              height={324}
              sizes="240px"
              className="h-12 w-auto sm:h-14"
            />
          </span>
          {isSet(practitioner.rpps) && (
            <p className="text-small text-white/75">
              N° RPPS : <span className="font-medium tabular-nums text-white">{practitioner.rpps}</span>
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-8 text-micro text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {isSet(SITE.CABINET_NAME) ? SITE.CABINET_NAME : SITE.PRACTITIONER_NAME}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            {social.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  {s.label}
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
