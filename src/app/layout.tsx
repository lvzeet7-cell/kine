import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/site";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { cityLabel, siteName } from "@/lib/seo";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.SITE_URL),
  title: {
    default: `Kinésithérapeute à ${cityLabel} | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: `Cabinet de kinésithérapie à ${cityLabel} : rééducation et accompagnement personnalisé. Informations pratiques et prise de rendez-vous.`,
  applicationName: siteName,
  formatDetection: { telephone: false },
  robots: SITE.INDEXING_ENABLED
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { type: "website", locale: "fr_FR", siteName },
};

export const viewport: Viewport = {
  themeColor: "#F7F7F4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable} data-scroll-behavior="smooth">
      <body>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
