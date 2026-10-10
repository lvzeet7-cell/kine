"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Chaque nouvelle page s'ouvre en haut, quel que soit l'endroit
 * où l'on se trouvait sur la page précédente.
 * (Sauf lien vers une ancre précise, ex. /contact#formulaire.)
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
