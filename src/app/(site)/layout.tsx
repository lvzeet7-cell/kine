import type { ReactNode } from "react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getOpeningDays } from "@/lib/booking/opening-hours";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome openingDays={await getOpeningDays()}>{children}</SiteChrome>;
}
