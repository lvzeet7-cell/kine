import Image from "next/image";
import Link from "next/link";
import { SITE, isSet } from "@/data/site";
import { cn } from "@/lib/cn";

/**
 * Logo.
 * - tone "dark" (header) : monogramme « LP » + nom du cabinet, à l'horizontale
 *   (emblème à gauche, nom à droite). Fichiers : /public/images/logo-embleme.png et logo-texte.png
 *   (logo complet sans fond : logo-leopold-pirard.png).
 * - tone "light" (footer, fond sombre) : version texte.
 */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  if (tone === "dark") {
    return (
      <Link href="/" className={cn("group flex min-w-0 items-center gap-3", className)} aria-label="Leopold PIRARD, masseur-kinésithérapeute — accueil">
        <LogoMark size={44} />
        <Image quality={90}
          src="/images/logo-texte-clair.png"
          alt=""
          width={213}
          height={38}
          priority
          className="h-[1.875rem] w-auto min-w-0 object-contain object-left"
        />
      </Link>
    );
  }
  const name = isSet(SITE.LOGO_TEXT) ? SITE.LOGO_TEXT : isSet(SITE.CABINET_NAME) ? SITE.CABINET_NAME : "[LOGO]";
  return (
    <Link
      href="/"
      className={cn("group flex min-w-0 items-center gap-3", className)}
      aria-label={`${name === "[LOGO]" ? "Cabinet de kinésithérapie" : name} — accueil`}
    >
      <LogoMark tone={tone} />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate text-[1.0625rem] font-semibold tracking-[-0.015em]",
            "text-white",
          )}
        >
          {name}
        </span>
        <span className="mt-1 text-micro text-white/70">
          Kinésithérapie
        </span>
      </span>
    </Link>
  );
}

/**
 * Monogramme « LP » du cabinet (dessiné en vectoriel d'après le logo fourni, sans fond).
 * Couleurs claires : le site est en thème sombre.
 */
export const LP_COLORS = { l: "#ECF0EE", p: "#6FA6D6" };

export function LogoMark({ size = 36 }: { tone?: "dark" | "light"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="15 7 57 57" aria-hidden="true" className="shrink-0">
      <path fill={LP_COLORS.l} d="M22 9h5v33h20v5H40v15h-4V47H22z" />
      <path fill="none" stroke={LP_COLORS.p} strokeWidth="4.3" d="M35 23H50.2a10.4 10.4 0 0 1 0 20.8H49.5" />
      <path fill={LP_COLORS.p} d="M40 30v7.2h-4v-3.6c0-2 1.6-3.4 4-3.6z" />
    </svg>
  );
}
