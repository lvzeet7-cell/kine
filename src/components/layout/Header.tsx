"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { headerNav } from "@/data/navigation";
import { SITE, fullAddress, hasPhone, isAddressSet, telHref } from "@/data/site";
import { cn } from "@/lib/cn";
import { BookingButton } from "@/components/ui/BookingButton";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "./Logo";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Header plus compact au défilement
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 16));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Ouverture / fermeture du menu mobile (élément <dialog> natif : focus piégé, touche Échap)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // Fermer le menu lors d'un changement de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Refermer le menu si l'écran s'élargit
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ease-out",
        scrolled ? "bg-surface/90 shadow-header backdrop-blur-md supports-[backdrop-filter]:bg-surface/80" : "bg-paper",
      )}
    >
      <div
        className={cn(
          "container-page flex items-center justify-between gap-4 transition-[height] duration-300 ease-out",
          scrolled ? "h-16" : "h-[4.5rem] lg:h-20",
        )}
      >
        <Logo className="flex-1 sm:flex-none" />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {hasPhone() && (
            <a
              href={telHref(SITE.PHONE)}
              className="hidden items-center gap-2 rounded-control px-3 py-2 text-[0.9375rem] font-semibold text-ink transition-colors hover:text-petrol xl:inline-flex"
            >
              <Icon name="phone" size={18} className="text-petrol" />
              {SITE.PHONE}
            </a>
          )}
          <BookingButton size="sm" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-ink/10 bg-surface text-ink transition-colors hover:border-petrol/40 xl:hidden"
          >
            <Icon name="menu" size={22} />
            <span className="sr-only">Ouvrir le menu</span>
          </button>
        </div>
      </div>

      {/* Ordinateur : toutes les sections sur une seconde ligne */}
      <nav aria-label="Navigation principale" className="hidden border-t border-line/80 xl:block">
        <ul className="container-page flex items-center justify-between">
          {headerNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative block whitespace-nowrap px-2 py-3 text-[0.875rem] font-medium transition-colors duration-200 2xl:text-[0.9375rem]",
                    active ? "text-petrol" : "text-ink/75 hover:text-ink",
                  )}
                >
                  {item.label}
                  {active && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-petrol" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <dialog
        id="menu-mobile"
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        className="menu-dialog m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto bg-paper p-0 text-ink"
      >
        <div className="flex min-h-full flex-col">
          <div className="container-page flex h-[4.5rem] items-center justify-between gap-4 border-b border-line">
            <Logo className="flex-1" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-control border border-ink/10 bg-surface text-ink"
            >
              <Icon name="close" size={22} />
              <span className="sr-only">Fermer le menu</span>
            </button>
          </div>

          <nav aria-label="Navigation mobile" className="container-page flex-1 py-4">
            <ul>
              {headerNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="border-b border-line/80">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between py-4 text-[1.375rem] font-semibold tracking-[-0.015em]",
                        active ? "text-petrol" : "text-ink",
                      )}
                    >
                      {item.label}
                      <Icon name="chevronRight" size={20} className="text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="container-page space-y-3 border-t border-line bg-surface py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <BookingButton size="lg" className="w-full" withIcon />
            {hasPhone() && (
              <a
                href={telHref(SITE.PHONE)}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-control border border-ink/15 font-semibold text-ink"
              >
                <Icon name="phone" size={18} />
                Appeler le {SITE.PHONE}
              </a>
            )}
            {isAddressSet() && (
              <p className="flex items-start justify-center gap-2 pt-1 text-center text-small text-muted">
                <Icon name="pin" size={18} className="mt-0.5 shrink-0" />
                {fullAddress()}
              </p>
            )}
          </div>
        </div>
      </dialog>
    </header>
  );
}
