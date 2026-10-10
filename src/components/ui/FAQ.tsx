import type { FaqItem } from "@/data/faq";
import { TODO } from "@/data/site";
import { Icon } from "@/components/ui/Icon";
import { Value } from "@/components/ui/Value";

/**
 * Accordéons FAQ basés sur <details>/<summary> :
 * accessibles au clavier et aux lecteurs d'écran, sans JavaScript.
 */
export function FAQ({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-left transition-colors hover:text-petrol">
            <span className="text-[1.0625rem] font-semibold leading-snug sm:text-[1.125rem]">{item.question}</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-petrol transition-transform duration-300 ease-out group-open:rotate-180">
              <Icon name="chevronDown" size={18} />
            </span>
          </summary>
          <div className="faq-answer max-w-prose space-y-3 pb-7 text-muted sm:pr-12">
            {item.answer.map((paragraph, i) =>
              paragraph.includes(TODO) ? (
                <p key={i}>
                  <Value>{paragraph}</Value>
                </p>
              ) : (
                <p key={i}>{paragraph}</p>
              ),
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
