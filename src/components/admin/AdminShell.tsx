"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LogoMark } from "@/components/layout/Logo";
import { api } from "@/components/booking/hooks";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Tableau de bord", icon: "home" },
  { href: "/admin/agenda", label: "Agenda", icon: "calendar" },
  { href: "/admin/rendez-vous", label: "Rendez-vous", icon: "person" },
  { href: "/admin/teleconsultations", label: "Téléconsultations", icon: "video" },
  { href: "/admin/horaires", label: "Horaires", icon: "clock" },
  { href: "/admin/conges", label: "Congés", icon: "shield" },
  { href: "/admin/indisponibilites", label: "Indisponibilités", icon: "alert" },
  { href: "/admin/parametres", label: "Paramètres", icon: "info" },
];

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = usePathname() ?? "/admin";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/connexion";
  };

  const nav = (
    <nav aria-label="Administration">
      <ul className="space-y-1">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2.5 text-small font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Barre latérale (ordinateur) */}
      <aside className="on-dark sticky top-0 hidden h-screen flex-col bg-petrol-deep px-4 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <LogoMark tone="light" />
          <div className="min-w-0">
            <p className="truncate text-small font-semibold text-white">{title}</p>
            <p className="text-micro text-white/60">Administration</p>
          </div>
        </div>
        <div className="mt-8 flex-1">{nav}</div>
        <div className="space-y-1 border-t border-white/10 pt-4">
          <Link href="/" className="flex items-center gap-3 rounded-control px-3 py-2.5 text-small text-white/70 hover:text-white">
            <Icon name="external" size={18} />
            Voir le site
          </Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-small text-white/70 hover:text-white">
            <Icon name="close" size={18} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Barre supérieure (mobile / tablette) */}
      <header className="on-dark sticky top-0 z-30 flex h-14 items-center justify-between bg-petrol-deep px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoMark tone="light" size={30} />
          <p className="truncate text-small font-semibold text-white">Administration</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="admin-menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-control text-white hover:bg-white/10"
        >
          <Icon name={open ? "close" : "menu"} size={22} />
          <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
        </button>
      </header>
      {open && (
        <div id="admin-menu" className="on-dark sticky top-14 z-20 border-b border-white/10 bg-petrol-deep px-4 pb-4 lg:hidden">
          {nav}
          <div className="mt-2 flex gap-2 border-t border-white/10 pt-3">
            <Link href="/" className="rounded-control px-3 py-2 text-small text-white/70 hover:text-white">
              Voir le site
            </Link>
            <button type="button" onClick={logout} className="rounded-control px-3 py-2 text-small text-white/70 hover:text-white">
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      <main id="contenu" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
