import Image from "next/image";
import Link from "next/link";
import { SITE, isSet } from "@/data/site";
import { cn } from "@/lib/cn";

/**
 * Logo.
 * - tone "dark" (header, fond clair) : logo officiel du cabinet, mis à l'horizontale
 *   (emblème à gauche, nom à droite). Fichiers : /public/images/logo-embleme.png et logo-texte.png
 *   (logo complet sans fond : logo-leopold-pirard.png).
 * - tone "light" (footer, fond sombre) : version texte.
 */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  if (tone === "dark") {
    return (
      <Link href="/" className={cn("group flex min-w-0 items-center gap-3", className)} aria-label="Leopold PIRARD, masseur-kinésithérapeute — accueil">
        <Image src="/images/logo-embleme.png" alt="" width={102} height={110} priority className="h-11 w-auto shrink-0" />
        <Image
          src="/images/logo-texte.png"
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

/** Pictogramme : arc d'amplitude articulaire gradué */
export function LogoMark({ tone = "dark", size = 36 }: { tone?: "dark" | "light"; size?: number }) {
  const bg = tone === "dark" ? "rgb(var(--petrol))" : "rgb(255 255 255 / 0.12)";
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <rect width="36" height="36" rx="10" fill={bg} />
      <path d="M27 27A18 18 0 0 0 9 9" fill="none" stroke="rgb(var(--sage))" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 27 L20.5 15.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 27H24" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="27" r="2.2" fill="#fff" />
    </svg>
  );
}
