import { revalidatePath } from "next/cache";
import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { adminReplaceAvailability } from "@/lib/booking/service";
import { json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/availability — horaires d'ouverture hebdomadaires */
export async function GET(request: Request) {
  return adminRoute(request, async () => json({ availability: await (await getRepo()).listAvailability() }));
}

/** PUT /api/admin/availability — { availability: [{ dayOfWeek, startTime, endTime, enabled }] } */
export async function PUT(request: Request) {
  return adminRoute(request, async () => {
    const body = await readJson(request);
    const r = await adminReplaceAvailability(await getRepo(), body?.availability);
    if (!r.ok) return json({ message: r.message }, 422);
    // Met à jour l'affichage des horaires sur tout le site
    revalidatePath("/", "layout");
    return json({ availability: r.availability });
  });
}
