import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { adminCreate, parseFilter, toAdmin } from "@/lib/booking/service";
import { json, readJson } from "@/lib/http";
import { prepareTeleconsultation } from "@/lib/teleconsultation/service";
import { getVideoProvider } from "@/lib/video";

export const dynamic = "force-dynamic";

/** GET /api/admin/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD&status=CONFIRMED,PENDING&service=bilan&q=dupont */
export async function GET(request: Request) {
  return adminRoute(request, async () => {
    const filter = parseFilter(new URL(request.url).searchParams);
    return json({ appointments: (await (await getRepo()).listAppointments(filter)).map(toAdmin) });
  });
}

/** POST /api/admin/appointments — création manuelle */
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const body = await readJson(request);
    if (!body) return json({ message: "Requête invalide." }, 400);
    const repo = await getRepo();
    const r = await adminCreate(repo, body);
    if (!r.ok) return json({ code: r.code, message: r.message, errors: r.errors }, r.code === "conflict" ? 409 : 422);
    await prepareTeleconsultation(repo, getVideoProvider(), r.appointment);
    return json({ appointment: toAdmin(r.appointment) }, 201);
  });
}
