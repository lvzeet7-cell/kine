import type { Testimonial } from "@/data/testimonials";
import { Icon } from "@/components/ui/Icon";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-card border border-line bg-surface p-7 sm:p-8">
      <Icon name="quote" size={28} className="text-sage" />
      <blockquote className="mt-5 flex-1 text-body text-ink/90">
        <p>{testimonial.quote}</p>
      </blockquote>
      <figcaption className="mt-6 border-t border-line pt-5 text-small">
        <span className="font-semibold text-ink">{testimonial.author}</span>
        {testimonial.context && <span className="block text-muted">{testimonial.context}</span>}
      </figcaption>
    </figure>
  );
}
