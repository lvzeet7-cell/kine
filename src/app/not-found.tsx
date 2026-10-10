import Link from "next/link";
import { mainNav } from "@/data/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getOpeningDays } from "@/lib/booking/opening-hours";

export const metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const openingDays = await getOpeningDays();
  const links = mainNav.filter((n) => ["/soins", "/contact", "/faq"].includes(n.href));
  return (
    <SiteChrome openingDays={openingDays}>
    <section className="py-section">
      <div className="container-page flex flex-col items-center text-center">
        <LogoMark size={56} />
        <p className="mt-8 text-small font-semibold tabular-nums text-sage-deep">Erreur 404</p>
        <h1 className="mt-3 text-h1">Cette page n&apos;existe pas.</h1>
        <p className="mt-5 max-w-md text-lead text-muted">
          Le lien est peut-être incorrect ou la page a été déplacée.
        </p>
        <ButtonLink href="/" size="lg" className="mt-10">
          Retour à l&apos;accueil
        </ButtonLink>
        <nav aria-label="Pages utiles" className="mt-10">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-small">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/rendez-vous" className="link">
                Rendez-vous
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </section>
    </SiteChrome>
  );
}
