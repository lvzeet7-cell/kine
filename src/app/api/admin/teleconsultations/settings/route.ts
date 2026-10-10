import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { emailConfigured } from "@/lib/email/send";
import { json, readJson } from "@/lib/http";
import { TELE_DURATIONS, getTeleSettings, saveTeleSettings } from "@/lib/teleconsultation/settings";
import { videoConfigured } from "@/lib/video";

export const dynamic = "force-dynamic";

/** GET /api/admin/teleconsultations/settings — réglages + état de la configuration */
export async function GET(request: Request) {
  return adminRoute(request, async () => {
    const settings = await getTeleSettings(await getRepo());
    return json({ settings, providerConfigured: videoConfigured(), emailConfigured: emailConfigured(), durations: TELE_DURATIONS });
  });
}

/** PUT /api/admin/teleconsultations/settings — { enabled, duration, price } */
export async function PUT(request: Request) {
  return adminRoute(request, async () => {
    const body = await readJson(request);
    if (!body) return json({ message: "Requête invalide." }, 400);
    const r = await saveTeleSettings(await getRepo(), body);
    if (!r.ok) return json({ message: "Certains champs sont à corriger.", errors: r.errors }, 422);
    return json({ settings: r.settings, providerConfigured: videoConfigured(), emailConfigured: emailConfigured() });
  });
}
