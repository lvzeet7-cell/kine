import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/notifications */
export async function GET(request: Request) {
  return adminRoute(request, async () => json({ notifications: await (await getRepo()).listNotifications(30) }));
}

/** POST /api/admin/notifications — { ids?: string[] } marque comme lues (toutes si ids absent) */
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const body = await readJson(request);
    const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string") : undefined;
    await (await getRepo()).markNotificationsRead(ids);
    return json({ ok: true });
  });
}
