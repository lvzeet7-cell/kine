import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/data/site";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";

export type Crumb = { label: string; href: string };

/** Fil d'Ariane + en-tête des pages secondaires */
export function PageHeader({
  title,
  intro,
  crumbs,
  children,
}: {
  title: string;
  intro?: ReactNode;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  const all: Crumb[] = [{ label: "Accueil", href: "/" }, ...crumbs];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${SITE.SITE_URL}${c.href === "/" ? "" : c.href}`,
    })),
  };

  return (
    <section className="border-b border-line">
      <JsonLd data={breadcrumbLd} />
      <div className="container-page pb-12 pt-8 sm:pb-16 sm:pt-10 lg:pb-20">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-1.5 text-micro text-muted">
            {all.map((c, i) => {
              const last = i === all.length - 1;
              return (
                <li key={c.href} className="flex items-center gap-1.5">
                  {last ? (
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
              );
            })}
          </ol>
        </nav>
        <div className="mt-10 max-w-3xl sm:mt-14">
          <h1 className="enter text-h1">{title}</h1>
          {intro && <div className="enter mt-5 max-w-2xl text-lead text-muted">{intro}</div>}
          {children}
        </div>
      </div>
    </section>
  );
}
