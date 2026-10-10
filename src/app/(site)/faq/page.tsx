import Link from "next/link";
import { faq } from "@/data/faq";
import { TODO } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/layout/PageHeader";
import { FAQ } from "@/components/ui/FAQ";
import { JsonLd } from "@/components/seo/JsonLd";
import { BookingCTA } from "@/components/sections/BookingCTA";

export const metadata = pageMetadata({
  title: "Questions fréquentes",
  description:
    "Rendez-vous, ordonnance, première séance, documents à apporter : les réponses aux questions fréquentes sur le cabinet de kinésithérapie.",
  path: "/faq",
});

export default function FaqPage() {
  // Seules les réponses complètes sont publiées en données structurées
  const complete = faq.filter((f) => !f.answer.some((a) => a.includes(TODO)));
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: complete.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer.join(" ") },
    })),
  };

  return (
    <>
      {complete.length > 0 && <JsonLd data={faqLd} />}
      <PageHeader
        title="Questions fréquentes"
        intro="Les réponses aux questions les plus posées. Si vous ne trouvez pas la vôtre, le cabinet vous répond volontiers."
        crumbs={[{ label: "FAQ", href: "/faq" }]}
      />
      <section className="py-section-sm">
        <div className="container-page max-w-4xl">
          <FAQ items={faq} />
          <p className="mt-10 text-muted">
            Une autre question ?{" "}
            <Link href="/contact" className="link">
              Contactez le cabinet
            </Link>
            .
          </p>
        </div>
      </section>
      <BookingCTA />
    </>
  );
}
