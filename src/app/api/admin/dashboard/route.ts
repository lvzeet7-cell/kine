import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { adminDashboard, toAdmin } from "@/lib/booking/service";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/dashboard — chiffres du jour, prochains rendez-vous, notifications */
export async function GET(request: Request) {
  return adminRoute(request, async () => {
    const d = await adminDashboard(await getRepo());
    return json({ ...d, todays: d.todays.map(toAdmin), upcoming: d.upcoming.map(toAdmin) });
  });
}
