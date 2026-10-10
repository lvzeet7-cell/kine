import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, services } from "@/data/services";
import { SITE, TODO, hasPhone, telHref } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/PageHeader";
import { BookingButton } from "@/components/ui/BookingButton";
import { Icon } from "@/components/ui/Icon";
import { Value } from "@/components/ui/Value";
import { BookingCTA } from "@/components/sections/BookingCTA";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return pageMetadata({
    title: service.title,
    description: service.metaDescription,
    path: `/soins/${service.slug}`,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <PageHeader
        title={service.title}
        intro={service.intro}
        crumbs={[
          { label: "Soins conventionnés", href: "/soins" },
          { label: service.title, href: `/soins/${service.slug}` },
        ]}
      >
        {service.logo && (
          <div className="mt-8 inline-flex h-24 items-center rounded-card border border-line bg-white px-5 py-3 sm:h-28">
            <Image quality={90}
              src={service.logo.src}
              alt={service.logo.alt}
              width={service.logo.width}
              height={service.logo.height}
              sizes="320px"
              priority
              className="h-full w-auto max-w-[16rem] object-contain sm:max-w-[20rem]"
            />
          </div>
        )}
      </PageHeader>

      <div className="container-page grid gap-14 py-section-sm lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
        <article className="min-w-0 space-y-16">
          <section aria-labelledby="description">
            <h2 id="description" className="text-[1.625rem] leading-tight">
              En quoi cela consiste
            </h2>
            <div className="mt-5 max-w-prose space-y-4 text-ink/90">
              {service.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section aria-labelledby="objectifs">
            <h2 id="objectifs" className="text-[1.625rem] leading-tight">
              Objectifs
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {service.objectives.map((o) => (
                <li key={o} className="flex gap-3 rounded-card border border-line bg-surface p-4">
                  <Icon name="check" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
                  <span className="text-small text-ink/90">{o}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-micro text-muted">
              Les objectifs sont définis avec vous après le bilan ; l&apos;évolution varie d&apos;une personne à
              l&apos;autre.
            </p>
          </section>

          <section aria-labelledby="deroulement">
            <h2 id="deroulement" className="text-[1.625rem] leading-tight">
              Déroulement
            </h2>
            <ol className="mt-6 border-l border-petrol/20">
              {service.steps.map((step, i) => (
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
              {service.practical.map((item) => (
                <li key={item} className="flex gap-3 py-4 text-small text-ink/90">
                  <Icon name="info" size={19} className="mt-0.5 shrink-0 text-petrol" />
                  {item.includes(TODO) ? <Value>{item}</Value> : <span>{item}</span>}
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-panel border border-line bg-surface p-7">
            <h2 className="text-h3">Prendre rendez-vous</h2>
            <p className="mt-2 text-small text-muted">
              En ligne, ou par téléphone si vous avez une question avant la première séance.
            </p>
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
              Autres prises en charge
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {others.map((s) => (
                <li key={s.slug}>
                  <Link href={`/soins/${s.slug}`} className="group flex items-center justify-between gap-3 py-3 font-medium text-ink hover:text-petrol">
                    {s.title}
                    <Icon name="chevronRight" size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
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
