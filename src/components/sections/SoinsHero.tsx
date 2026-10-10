import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/data/site";
import { Icon, type IconName } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { delay } from "@/lib/motion";
import { cn } from "@/lib/cn";

type CardItem = { label: string; detail?: string; icon?: IconName; href?: string };

export type SoinsHeroProps = {
  badge: { icon: IconName; label: string };
  title: string;
  intro: ReactNode;
  features?: { icon: IconName; label: string }[];
  image: { src: string; alt: string; position?: string };
  /** Encadré posé sur la photo (facultatif) */
  card?: { icon: IconName; title: string; items: CardItem[]; tone: "light" | "dark"; tagline?: string };
  /** Boutons sous le texte (facultatif) */
  actions?: ReactNode;
  /** Petite phrase manuscrite à droite de la photo (facultatif) */
  signature?: string;
  /** Photo à gauche, texte à droite */
  reverse?: boolean;
  crumb: { label: string; href: string };
};

/**
 * Bannière des pages intérieures : texte, photo fondue dans le fond,
 * encadré récapitulatif facultatif, pictogrammes et boutons.
 */
export function SoinsHero({ badge, title, intro, features = [], image, card, actions, signature, reverse = false, crumb }: SoinsHeroProps) {
  const dark = card?.tone === "dark";
  const cols5 = features.length === 5;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: SITE.SITE_URL },
            { "@type": "ListItem", position: 2, name: crumb.label, item: `${SITE.SITE_URL}${crumb.href}` },
          ],
        }}
      />
      <section aria-labelledby="soins-hero-title" className="relative isolate overflow-hidden border-b border-line bg-paper">
        {/* Photo : en haut sur téléphone, sur le côté et fondue sur ordinateur */}
        <div
          className={cn(
            "relative h-64 xs:h-72 sm:h-96 lg:absolute lg:inset-y-0 lg:-z-10 lg:h-auto",
            reverse ? "lg:left-0 lg:w-[50%]" : "lg:right-0",
            !reverse && (signature ? "lg:right-[16%] lg:w-[50%]" : "lg:w-[56%]"),
          )}
        >
          <Image quality={90}
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="object-cover"
            style={{ objectPosition: image.position }}
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 hidden via-[16%] to-transparent lg:block",
              reverse
                ? "bg-gradient-to-l from-paper via-paper/40 to-[40%]"
                : "bg-gradient-to-r from-paper via-paper/40 to-[40%]",
            )}
          />
          {signature && (
            <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-l from-paper via-transparent via-[18%] to-transparent lg:block" />
          )}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent lg:hidden" />
        </div>

        <div
          className={cn(
            "container-page relative grid gap-10 pb-12 pt-2 sm:pt-4 lg:min-h-[34rem] lg:items-center lg:gap-8 lg:py-14",
            card && "lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_23rem]",
            reverse && "lg:grid-cols-[44%_minmax(0,1fr)]",
            signature && "lg:grid-cols-[minmax(0,1fr)_12rem]",
          )}
        >
          {reverse && <div aria-hidden="true" className="hidden lg:block" />}
          <div className={cn("max-w-[36rem]", reverse ? "lg:max-w-[40rem]" : "lg:max-w-[33rem]")}>
            <nav aria-label="Fil d'Ariane" className="hidden lg:block">
              <ol className="flex items-center gap-1.5 text-micro text-muted">
                <li className="flex items-center gap-1.5">
                  <Link href="/" className="transition-colors hover:text-petrol">
                    Accueil
                  </Link>
                  <Icon name="chevronRight" size={14} className="text-muted/60" />
                </li>
                <li>
                  <span aria-current="page" className="text-ink">
                    {crumb.label}
                  </span>
                </li>
              </ol>
            </nav>
            <p className="enter inline-flex items-center gap-3 rounded-full bg-petrol-soft py-1.5 pl-1.5 pr-5 text-micro font-semibold uppercase tracking-[0.14em] text-petrol lg:mt-8">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Icon name={badge.icon} size={18} />
              </span>
              {badge.label}
            </p>
            <h1
              id="soins-hero-title"
              className={cn("enter mt-6 text-display text-ink", reverse && "lg:text-[clamp(2.5rem,3.4vw,3.375rem)]")}
              style={delay(60)}
            >
              {title}
            </h1>
            <span aria-hidden="true" className="enter mt-6 block h-1 w-16 rounded-full bg-sage" style={delay(100)} />
            <div className="enter mt-6 text-lead text-ink/80" style={delay(140)}>
              {intro}
            </div>
            {features.length > 0 && (
              <ul
                className={cn(
                  cols5 ? "enter mt-9 grid grid-cols-3 gap-x-3 gap-y-6" : "enter mt-9 grid grid-cols-2 gap-x-4 gap-y-6",
                  cols5 ? "sm:grid-cols-5" : "sm:grid-cols-4",
                )}
                style={delay(200)}
              >
                {features.map((f) => (
                  <li key={f.label} className="flex flex-col items-center gap-2.5 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol-soft text-petrol">
                      <Icon name={f.icon} size={26} />
                    </span>
                    <span className="text-[0.8125rem] leading-snug text-ink/85">{f.label}</span>
                  </li>
                ))}
              </ul>
            )}
            {actions && (
              <div className="enter mt-9 flex flex-col gap-3 xs:flex-row" style={delay(220)}>
                {actions}
              </div>
            )}
          </div>

          {signature && (
            <p
              aria-hidden="true"
              className="hidden -rotate-6 self-center text-right text-[1.75rem] italic leading-tight text-petrol/80 lg:block"
            >
              {signature}
              <span className="ml-auto mt-2 block h-px w-24 bg-sage-deep/60" />
            </p>
          )}

          {card && (
            <aside
              aria-labelledby="soins-hero-card"
              className={cn(
                "enter self-center rounded-panel p-6 shadow-lift sm:p-7",
                dark ? "on-dark bg-petrol-deep text-white" : "border border-white/70 bg-white/85 backdrop-blur-md",
              )}
              style={delay(260)}
            >
              <h2
                id="soins-hero-card"
                className={cn("flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.12em]", dark ? "text-sage-soft" : "text-petrol")}
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", dark ? "border border-white/30" : "bg-petrol-soft")}>
                  <Icon name={card.icon} size={20} />
                </span>
                {card.title}
              </h2>
              <ul className={cn("mt-5", card.items.some((i) => i.icon) ? "space-y-4" : "space-y-3")}>
                {card.items.map((it) => (
                  <li key={it.label} className="flex items-start gap-3 text-[0.9375rem]">
                    {it.icon ? (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-petrol-soft text-petrol">
                        <Icon name={it.icon} size={19} />
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          dark ? "text-white" : "bg-sage-deep text-white",
                        )}
                      >
                        <Icon name="tick" size={dark ? 18 : 13} strokeWidth={2.5} />
                      </span>
                    )}
                    <span className="min-w-0">
                      {it.href ? (
                        <Link href={it.href} className={cn("underline-offset-4 hover:underline", dark ? "text-white" : "text-ink")}>
                          {it.label}
                        </Link>
                      ) : (
                        <span className={dark ? "text-white/90" : "text-ink"}>{it.label}</span>
                      )}
                      {it.detail && <span className={cn("block text-small", dark ? "text-white/70" : "text-muted")}>{it.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {card.tagline && <p className="mt-6 text-[1.125rem] italic leading-snug text-sage-soft">{card.tagline}</p>}
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
