import Link from "next/link";
import { notFound } from "next/navigation";
import { getNonConventionedCare, nonConventionnes } from "@/data/non-conventionnes";
import { SITE, TODO, hasPhone, telHref } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/PageHeader";
import { BookingButton } from "@/components/ui/BookingButton";
import { Icon } from "@/components/ui/Icon";
import { Value } from "@/components/ui/Value";
import { BookingCTA } from "@/components/sections/BookingCTA";
import { CareHero } from "@/components/sections/CareHero";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return nonConventionnes.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const care = getNonConventionedCare(slug);
  if (!care) return {};
  return pageMetadata({
    title: care.title,
    description: care.metaDescription,
    path: `/soins-non-conventionnes/${care.slug}`,
  });
}

const text = (s: string) => (s.includes(TODO) ? <Value>{s}</Value> : <span>{s}</span>);

export default async function NonConventionedCarePage({ params }: Props) {
  const { slug } = await params;
  const care = getNonConventionedCare(slug);
  if (!care) notFound();

  const others = nonConventionnes.filter((c) => c.slug !== care.slug);
  const crumbs = [
    { label: "Soins non conventionnés", href: "/soins-non-conventionnes" },
    { label: care.title, href: `/soins-non-conventionnes/${care.slug}` },
  ];

  return (
    <>
      {care.hero ? (
        <CareHero hero={care.hero} crumbs={crumbs} />
      ) : (
        <PageHeader title={care.title} intro={care.intro} crumbs={crumbs} />
      )}

      <div className="container-page grid gap-14 py-section-sm lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
        <article className="min-w-0 space-y-16">
          <section aria-labelledby="description">
            <h2 id="description" className="text-[1.625rem] leading-tight">
              En quoi cela consiste
            </h2>
            <div className="mt-5 max-w-prose space-y-4 text-ink/90">
              {care.details.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="pour-qui">
            <h2 id="pour-qui" className="text-[1.625rem] leading-tight">
              Pour qui ?
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {care.audience.map((o) => (
                <li key={o} className="flex gap-3 rounded-card border border-line bg-surface p-4">
                  <Icon name="check" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
                  <span className="text-small text-ink/90">{o}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="deroulement">
            <h2 id="deroulement" className="text-[1.625rem] leading-tight">
              Déroulement de la séance
            </h2>
            <ol className="mt-6 border-l border-petrol/20">
              {care.steps.map((step, i) => (
                <li key={step.title} className="relative pb-8 pl-8 last:pb-0">
                  <span className="absolute -left-[0.8125rem] top-0 flex h-[1.625rem] w-[1.625rem] items-center justify-center rounded-full bg-petrol text-[0.75rem] font-semibold tabular-nums text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-h3">{step.title}</h3>
                  <p className="mt-1 text-small text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="infos">
            <h2 id="infos" className="text-[1.625rem] leading-tight">
              Informations utiles
            </h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {care.practical.map((item) => (
                <li key={item} className="flex gap-3 py-4 text-small text-ink/90">
                  <Icon name="info" size={19} className="mt-0.5 shrink-0 text-petrol" />
                  {text(item)}
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-panel border border-line bg-surface p-7">
            <dl className="grid grid-cols-2 gap-4 border-b border-line pb-6">
              <div>
                <dt className="text-micro text-muted">Durée</dt>
                <dd className="mt-1 font-semibold">{care.duration ? text(care.duration) : text(TODO)}</dd>
              </div>
              <div>
                <dt className="text-micro text-muted">Tarif</dt>
                <dd className="mt-1 text-[1.25rem] font-semibold tabular-nums text-petrol">{text(care.price)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-small text-muted">Non remboursé par l&apos;Assurance Maladie.</p>
            <BookingButton className="mt-6 w-full" withIcon />
            {hasPhone() && (
              <a
                href={telHref(SITE.PHONE)}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-control border border-ink/15 font-semibold text-ink transition-colors hover:border-petrol/40 hover:text-petrol"
              >
                <Icon name="phone" size={18} />
                {SITE.PHONE}
              </a>
            )}
          </div>

          <nav aria-labelledby="autres-soins" className="mt-8">
            <h2 id="autres-soins" className="text-small font-semibold text-muted">
              Autres soins non conventionnés
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/soins-non-conventionnes/${c.slug}`}
                    className="group flex items-center justify-between gap-3 py-3 font-medium text-ink hover:text-petrol"
                  >
                    {c.title}
                    <Icon name="chevronRight" size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      <BookingCTA />
    </>
  );
}
