import { adminConfigured, isAdminRequest } from "@/lib/auth";
import { json, safe, sameOrigin } from "@/lib/http";

/**
 * Enveloppe des routes API admin : session obligatoire,
 * contrôle d'origine (CSRF) pour les requêtes qui modifient des données.
 */
export function adminRoute(request: Request, handler: () => Promise<Response>) {
  return safe(async () => {
    if (!adminConfigured()) {
      return json({ message: "Espace admin non configuré (ADMIN_PASSWORD et SESSION_SECRET)." }, 503);
    }
    if (!(await isAdminRequest(request))) return json({ message: "Session expirée. Reconnectez-vous." }, 401);
    if (request.method !== "GET" && !sameOrigin(request)) return json({ message: "Requête refusée." }, 403);
    return handler();
  });
}
