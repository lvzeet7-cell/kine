import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { faq } from "@/data/faq";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { BookingCTA } from "@/components/sections/BookingCTA";
import { Icon } from "@/components/ui/Icon";

export const metadata = pageMetadata({
  title: "Déroulement d'une prise en charge",
  description:
    "Premier échange, bilan, séances, suivi : comment se déroule une prise en charge au cabinet de kinésithérapie, étape par étape.",
  path: "/deroulement",
});

export default function DeroulementPage() {
  const toBring = faq.find((f) => f.question.startsWith("Que faut-il apporter"));

  return (
    <>
      <PageHeader
        title="Déroulement d'une prise en charge"
        intro="Savoir à quoi s'attendre aide à venir plus sereinement. Voici les grandes étapes, du premier rendez-vous au suivi."
        crumbs={[{ label: "Déroulement", href: "/deroulement" }]}
      />

      <section className="py-section-sm">
        <div className="container-page grid gap-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
          <ProcessSteps variant="detailed" />

          <aside aria-labelledby="preparer" className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-panel bg-sage-soft p-7 sm:p-8">
              <h2 id="preparer" className="text-h3">
                Préparer votre première séance
              </h2>
              {toBring && (
                <div className="mt-4 space-y-3 text-small text-ink/85">
                  {toBring.answer.slice(0, 2).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
              <p className="mt-6 flex gap-2 text-small">
                <Icon name="info" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                <span>
                  D&apos;autres questions ?{" "}
                  <Link href="/faq" className="link">
                    Consultez la FAQ
                  </Link>
                  .
                </span>
              </p>
            </div>
          </aside>
        </div>
      </section>

      <BookingCTA />
    </>
  );
}
