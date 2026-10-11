import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, adminConfigured, verifySession } from "@/lib/auth";

/**
 * À appeler en tête de chaque page admin qui lit des données patients :
 * la vérification du layout ne suffit pas à elle seule (en navigation interne,
 * Next.js peut rendre une page sans relancer son layout).
 */
export async function requireAdmin() {
  if (!adminConfigured()) redirect("/admin/connexion");
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySession(session))) redirect("/admin/connexion");
}
