import { TODO } from "@/data/site";
import { cn } from "@/lib/cn";

/**
 * Affiche une valeur de configuration.
 * Si elle n'est pas renseignée, elle apparaît surlignée pour être repérée.
 */
export function Value({ children, className }: { children: string; className?: string }) {
  if (children.includes(TODO)) {
    return <span className={cn("todo", className)}>{children}</span>;
  }
  return <span className={className}>{children}</span>;
}
