import Image from "next/image";
import Link from "next/link";
import type { Service } from "@/data/services";
import { Icon } from "@/components/ui/Icon";

/**
 * Carte d'une prise en charge. Toute la carte est cliquable
 * (le lien est étendu via un pseudo-élément), le titre reste le texte du lien.
 */
export function ServiceCard({ service, headingLevel = "h3" }: { service: Service; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col bg-surface p-7 transition-colors duration-200 hover:bg-[rgb(var(--petrol-soft)/0.45)] sm:p-8">
      {service.logo ? (
        <span className="flex h-20 w-fit items-center rounded-card border border-line bg-white px-4 py-2.5">
          <Image quality={90}
            src={service.logo.src}
            alt={service.logo.alt}
            width={service.logo.width}
            height={service.logo.height}
            sizes="200px"
            className="h-full w-auto max-w-[14rem] object-contain"
          />
        </span>
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-card bg-petrol-soft text-petrol transition-colors duration-200 group-hover:bg-petrol group-hover:text-white">
          <Icon name={service.icon} size={24} />
        </span>
      )}
      <Heading className="mt-6 text-h3">
        <Link
          href={`/soins/${service.slug}`}
          className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-card focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-4 focus-visible:after:outline-petrol"
        >
          {service.title}
        </Link>
      </Heading>
      <p className="mt-3 flex-1 text-small text-muted">{service.summary}</p>
      <span aria-hidden="true" className="mt-6 inline-flex items-center gap-1.5 text-small font-semibold text-petrol">
        En savoir plus
        <Icon name="chevronRight" size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}

/** Grille de cartes séparées par des filets fins */
export function ServiceGrid({ items, headingLevel }: { items: Service[]; headingLevel?: "h2" | "h3" }) {
  return (
    <ul
      className={`grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 ${
        items.length % 3 === 0 ? "lg:grid-cols-3" : ""
      }`}
    >
      {items.map((service) => (
        <li key={service.slug}>
          <ServiceCard service={service} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
