import { getRepo } from "@/lib/booking/server";
import { getDaySlots, nextAvailableDate } from "@/lib/booking/service";
import { clientIp, json, rateLimited, safe } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/booking/slots?service=seance&date=2026-10-14 — créneaux libres d'une journée */
export async function GET(request: Request) {
  return safe(async () => {
    if (rateLimited(`slots:${clientIp(request)}`, 120, 60_000)) {
      return json({ message: "Trop de requêtes. Réessayez dans un instant." }, 429);
    }
    const url = new URL(request.url);
    const service = url.searchParams.get("service") ?? "";
    const date = url.searchParams.get("date") ?? "";
    const repo = await getRepo();
    const result = await getDaySlots(repo, service, date);
    if (!result.ok) return json({ message: result.message }, 400);
    const next = result.slots.length === 0 ? await nextAvailableDate(repo, service, date) : null;
    return json({ slots: result.slots, nextAvailableDate: next });
  });
}
