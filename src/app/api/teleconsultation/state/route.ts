import { getRepo } from "@/lib/booking/server";
import { findByToken } from "@/lib/booking/service";
import { clientIp, json, rateLimited, safe } from "@/lib/http";
import { isTeleAppointment, patientOpensAt, patientState } from "@/lib/teleconsultation/service";
import { videoConfigured } from "@/lib/video";

export const dynamic = "force-dynamic";

/** GET /api/teleconsultation/state?token=… — état de la téléconsultation (sans données personnelles) */
export async function GET(request: Request) {
  return safe(async () => {
    if (rateLimited(`tele-state:${clientIp(request)}`, 120, 15 * 60_000)) return json({ message: "Trop de requêtes." }, 429);
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const a = await findByToken(await getRepo(), token);
    if (!a || !isTeleAppointment(a)) return json({ message: "Ce lien n'est pas valide." }, 404);
    return json(
      { state: patientState(a), opensAt: patientOpensAt(a), startAt: a.startAt, endAt: a.endAt, configured: videoConfigured() },
      200,
      { "Cache-Control": "no-store" },
    );
  });
}
