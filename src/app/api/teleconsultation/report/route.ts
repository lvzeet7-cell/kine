import { getRepo } from "@/lib/booking/server";
import { findByToken } from "@/lib/booking/service";
import { clientIp, json, rateLimited, readJson, safe, sameOrigin } from "@/lib/http";
import { reportIssue } from "@/lib/teleconsultation/service";

export const dynamic = "force-dynamic";

/** POST /api/teleconsultation/report — { token, text } : signalement d'un problème technique au cabinet */
export async function POST(request: Request) {
  return safe(async () => {
    if (!sameOrigin(request)) return json({ message: "Requête refusée." }, 403);
    if (rateLimited(`tele-report:${clientIp(request)}`, 5, 15 * 60_000)) return json({ message: "Trop de signalements. Appelez le cabinet." }, 429);
    const body = await readJson(request);
    const repo = await getRepo();
    const a = await findByToken(repo, typeof body?.token === "string" ? body.token : "");
    if (!a) return json({ message: "Ce lien n'est pas valide." }, 404);
    const r = await reportIssue(repo, a, body?.text);
    return r.ok ? json({ ok: true }) : json({ message: r.message }, 422);
  });
}
