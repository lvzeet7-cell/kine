"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE, hasPhone, telHref } from "@/data/site";
import { BookingButton } from "@/components/ui/BookingButton";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * Barre fixe en bas d'écran, sur mobile uniquement : rendez-vous toujours
 * à portée de pouce. Sur l'accueil, elle apparaît une fois le premier écran
 * dépassé (le bouton du hero est alors hors de vue). Masquée sur /rendez-vous.
 */
export function MobileBookingBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  if (pathname === "/rendez-vous") return null;
  const visible = !isHome || pastHero;

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 ease-out md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-md gap-2">
        {hasPhone() && (
          <a
            href={telHref(SITE.PHONE)}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-ink/15 text-petrol"
          >
            <Icon name="phone" size={20} />
            <span className="sr-only">Appeler le cabinet</span>
          </a>
        )}
        <BookingButton size="md" className="flex-1" withIcon />
      </div>
    </div>
  );
}
