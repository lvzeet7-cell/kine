import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SITE, isSet } from "@/data/site";
import { SESSION_COOKIE, adminConfigured, verifySession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/** Toutes les pages de /admin (sauf la connexion) exigent une session valide */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!adminConfigured()) redirect("/admin/connexion");
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySession(session))) redirect("/admin/connexion");
  return <AdminShell title={isSet(SITE.LOGO_TEXT) ? SITE.LOGO_TEXT : "Cabinet"}>{children}</AdminShell>;
}
