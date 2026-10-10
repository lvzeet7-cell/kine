import { getRepo } from "@/lib/booking/server";
import { findByToken } from "@/lib/booking/service";
import { clientIp, json, rateLimited, readJson, safe, sameOrigin } from "@/lib/http";
import { joinAsPatient } from "@/lib/teleconsultation/service";
import { getVideoProvider } from "@/lib/video";

export const dynamic = "force-dynamic";

/**
 * POST /api/teleconsultation/join — { token }
 * Accès patient : le jeton secret du lien personnel est vérifié côté serveur (empreinte SHA-256),
 * puis un jeton vidéo temporaire, propre à la salle de CE rendez-vous, est délivré.
 */
export async function POST(request: Request) {
  return safe(async () => {
    if (!sameOrigin(request)) return json({ message: "Requête refusée." }, 403);
    if (rateLimited(`tele-join:${clientIp(request)}`, 20, 15 * 60_000)) {
      return json({ message: "Trop de tentatives. Patientez quelques minutes ou appelez le cabinet." }, 429);
    }
    const body = await readJson(request);
    const token = typeof body?.token === "string" ? body.token : "";
    const repo = await getRepo();
    const a = await findByToken(repo, token);
    if (!a) return json({ code: "invalid", message: "Ce lien n'est pas valide. Vérifiez l'e-mail de confirmation ou redemandez le lien." }, 404);
    const r = await joinAsPatient(repo, getVideoProvider(), a);
    if (!r.ok) {
      const status = r.code === "not_configured" ? 503 : r.code === "provider_error" ? 502 : 409;
      return json(r, status, { "Cache-Control": "no-store" });
    }
    return json(r, 200, { "Cache-Control": "no-store" });
  });
}
