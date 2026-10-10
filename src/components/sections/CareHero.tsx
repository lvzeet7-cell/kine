import Image from "next/image";
import Link from "next/link";
import type { CareHero as CareHeroData } from "@/data/non-conventionnes";
import { SITE } from "@/data/site";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { delay } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Crumb = { label: string; href: string };

/**
 * Bannière illustrée d'une fiche de soin : photo fondue vers la gauche, titre en deux
 * niveaux, pastilles (sports), puis bandeau de 4 bénéfices et bouton de rendez-vous.
 */
export function CareHero({ hero, crumbs, bookingHref = "/rendez-vous" }: { hero: CareHeroData; crumbs: Crumb[]; bookingHref?: string }) {
  const all = [{ label: "Accueil", href: "/" }, ...crumbs];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            item: `${SITE.SITE_URL}${c.href === "/" ? "" : c.href}`,
          })),
        }}
      />

      <section aria-labelledby="care-title" className="relative isolate overflow-hidden bg-paper">
        <div className="relative h-64 xs:h-72 sm:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:-z-10 lg:h-auto lg:w-[60%]">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
            style={{ objectPosition: hero.image.position }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden bg-gradient-to-r from-paper via-paper/50 via-[14%] to-transparent to-[38%] lg:block"
          />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent lg:hidden" />
        </div>

        {/* Vague décorative en bas à gauche */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-0 left-0 hidden h-10 w-[28rem] text-sage/25 lg:block"
        >
          <path d="M0 60V30C80 0 200 0 400 60Z" fill="currentColor" />
        </svg>

        <div className="container-page relative pb-12 pt-2 sm:pt-4 lg:flex lg:min-h-[36rem] lg:items-center lg:py-14">
          <div className="max-w-[36rem] lg:max-w-[34rem] xl:max-w-[40rem]">
            <nav aria-label="Fil d'Ariane" className="hidden lg:block">
              <ol className="flex flex-wrap items-center gap-1.5 text-micro text-muted">
                {all.map((c, i) => (
                  <li key={c.href} className="flex items-center gap-1.5">
                    {i === all.length - 1 ? (
                      <span aria-current="page" className="text-ink">
                        {c.label}
                      </span>
                    ) : (
                      <>
                        <Link href={c.href} className="transition-colors hover:text-petrol">
                          {c.label}
                        </Link>
                        <Icon name="chevronRight" size={14} className="text-muted/60" />
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <h1 id="care-title" className="enter uppercase lg:mt-10">
              <span className="block text-[1.5rem] font-light tracking-[0.18em] text-sage-deep sm:text-[1.875rem] lg:text-[2.125rem]">
                {hero.titleTop}
              </span>
              <span className="mt-1 block text-[1.875rem] font-bold leading-tight tracking-[0.02em] text-petrol sm:text-[2.5rem] lg:text-[2.75rem] xl:whitespace-nowrap">
                {hero.titleBottom}
              </span>
            </h1>
            <span aria-hidden="true" className="enter mt-6 block h-1.5 w-32 rounded-full bg-gradient-to-r from-sage to-sage/30" style={delay(60)} />
            <p className="enter mt-6 max-w-[33rem] text-lead text-ink/80" style={delay(120)}>
              {hero.intro}
            </p>

            <ul className="enter mt-8 grid grid-cols-4 gap-1 sm:flex sm:gap-2" style={delay(180)} aria-label="Pour les sportifs">
              {hero.tags.map((t, i) => (
                <li
                  key={t.label}
                  className={cn("flex flex-col items-center gap-2 text-center sm:w-28", i > 0 && "sm:border-l sm:border-line")}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol-soft text-petrol sm:h-16 sm:w-16">
                    <Icon name={t.icon} size={28} />
                  </span>
                  <span className="text-[0.75rem] font-medium leading-tight text-ink sm:text-small">{t.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Bénéfices + rendez-vous */}
      <section aria-label="Les bienfaits" className="relative overflow-hidden border-y border-line bg-surface">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -bottom-2 right-0 hidden h-40 w-[45%] text-sage/35 lg:block"
        >
          <path d="M0 200C150 60 380 20 600 70" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="container-page relative py-12 lg:py-14">
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {hero.benefits.map((b, i) => (
              <li key={b.title} className={i > 0 ? "lg:border-l lg:border-line lg:px-8" : "lg:pr-8"}>
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-petrol-soft text-petrol">
                  <Icon name={b.icon} size={28} />
                </span>
                <h2 className="mt-5 text-[1.1875rem] font-semibold text-petrol">{b.title}</h2>
                <p className="mt-2 text-small text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <ButtonLink href={bookingHref} size="lg" className="w-full rounded-full px-8 sm:w-auto">
              <Icon name="calendar" size={18} />
              Prendre rendez-vous
              <Icon name="chevronRight" size={18} />
            </ButtonLink>
            {hero.signature && (
              <p className="flex items-center gap-3 text-micro font-medium uppercase tracking-[0.24em] text-sage-deep">
                <Icon name="mountain" size={22} />
                {hero.signature.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
