import { adminRoute } from "@/lib/admin-route";
import { SITE } from "@/data/site";
import { getRepo } from "@/lib/booking/server";
import { json } from "@/lib/http";
import { joinAsPractitioner } from "@/lib/teleconsultation/service";
import { getVideoProvider } from "@/lib/video";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/admin/teleconsultations/[id]/join — jeton praticien (propriétaire de la salle), session admin obligatoire */
export async function POST(request: Request, { params }: Ctx) {
  return adminRoute(request, async () => {
    const { id } = await params;
    const repo = await getRepo();
    const a = await repo.getAppointment(id);
    if (!a) return json({ message: "Rendez-vous introuvable." }, 404);
    const r = await joinAsPractitioner(repo, getVideoProvider(), a, SITE.PRACTITIONER_NAME);
    if (!r.ok) return json(r, r.code === "not_configured" ? 503 : r.code === "provider_error" ? 502 : 409, { "Cache-Control": "no-store" });
    return json(r, 200, { "Cache-Control": "no-store" });
  });
}
