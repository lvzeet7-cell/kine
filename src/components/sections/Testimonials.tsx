import { testimonials } from "@/data/testimonials";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/ui/TestimonialCard";

/** Section « Ils témoignent » — n'apparaît que si des témoignages réels existent. */
export function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="temoignages-title" className="py-section">
      <div className="container-page">
        <SectionHeading id="temoignages-title" title="Ils témoignent" />
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <li key={`${t.author}-${i}`}>
              <TestimonialCard testimonial={t} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
