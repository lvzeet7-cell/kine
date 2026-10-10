import { getRepo } from "@/lib/booking/server";
import { getMonthAvailability } from "@/lib/booking/service";
import { clientIp, json, rateLimited, safe } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/booking/availability?service=seance&month=2026-10 — état des jours du mois */
export async function GET(request: Request) {
  return safe(async () => {
    if (rateLimited(`avail:${clientIp(request)}`, 120, 60_000)) {
      return json({ message: "Trop de requêtes. Réessayez dans un instant." }, 429);
    }
    const url = new URL(request.url);
    const result = await getMonthAvailability(
      await getRepo(),
      url.searchParams.get("service") ?? "",
      url.searchParams.get("month") ?? "",
    );
    if (!result.ok) return json({ message: result.message }, 400);
    return json({ days: result.days });
  });
}
