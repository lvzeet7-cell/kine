import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { adminAddUnavailability } from "@/lib/booking/service";
import { json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/unavailabilities?from=YYYY-MM-DD — indisponibilités ponctuelles */
export async function GET(request: Request) {
  return adminRoute(request, async () => {
    const from = new URL(request.url).searchParams.get("from") ?? undefined;
    return json({ unavailabilities: await (await getRepo()).listUnavailabilities(from) });
  });
}

/** POST /api/admin/unavailabilities — { date, startTime, endTime, reason } */
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const r = await adminAddUnavailability(await getRepo(), (await readJson(request)) ?? {});
    return r.ok ? json({ unavailability: r.unavailability }, 201) : json({ message: r.message }, 422);
  });
}
