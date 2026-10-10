import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { purgeExpired } from "@/lib/booking/service";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** POST /api/admin/purge — supprime les rendez-vous plus anciens que la durée de conservation */
export async function POST(request: Request) {
  return adminRoute(request, async () => json({ deleted: await purgeExpired(await getRepo()) }));
}
