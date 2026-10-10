import type { ReactNode } from "react";
import type { OpeningDay } from "@/data/site";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBookingBar } from "./MobileBookingBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { localBusinessSchema } from "@/lib/schema";

/** Habillage des pages publiques : en-tête, pied de page, barre de rendez-vous mobile */
export function SiteChrome({ children, openingDays }: { children: ReactNode; openingDays: OpeningDay[] }) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-petrol focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
      >
        Aller au contenu
      </a>
      <JsonLd data={localBusinessSchema(openingDays)} />
      <Header />
      <main id="contenu" tabIndex={-1} className="overflow-x-clip focus:outline-none">
        {children}
      </main>
      <Footer openingDays={openingDays} />
      <div aria-hidden="true" className="h-[4.75rem] bg-petrol-deep md:hidden" />
      <MobileBookingBar />
    </>
  );
}
